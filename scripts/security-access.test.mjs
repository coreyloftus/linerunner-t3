import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const silentConsole = { ...console, log() {}, error() {} };

// Load actual server modules with credentials and external calls replaced by fixtures.
function loadServer(mocks) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const resolve = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (!id.startsWith("~/") && !id.startsWith(".")) return require(id);
      let target = id.startsWith("~/") ? path.join(root, "src", id.slice(2)) : path.resolve(path.dirname(file), id);
      if (!fs.existsSync(target)) target += fs.existsSync(`${target}.ts`) ? ".ts" : ".js";
      return target.endsWith(".json") ? require(target) : load(target);
    };
    vm.runInThisContext(`(function(require,module,exports,console){${code}\n})`, { filename: file })(resolve, module, module.exports, silentConsole);
    return module.exports;
  }
  return load;
}

const session = { user: { id: "fixture-id", email: "owner@example.com" }, expires: "2099-01-01" };
const context = (value) => ({ session: value, headers: new Headers() });

function fixtureDatabase() {
  const calls = [];
  let count = 49;
  let nextId = 0;
  const ref = (pathname, kind = "document") => ({
    path: pathname, kind, id: pathname.split("/").at(-1),
    collection: (name) => ref(`${pathname}/${name}`, "collection"),
    doc: (id = `created-${++nextId}`) => ref(`${pathname}/${id}`),
    select: () => ref(pathname, "query"),
    limit: () => ref(pathname, "query"),
    get: async () => {
      calls.push(["get", pathname]);
      return { size: count, docs: [{ id: "fixture", data: () => ({ project: "Private fixture", scenes: [] }) }] };
    },
    delete: async () => { calls.push(["delete", pathname]); },
    add: async () => { count++; return { id: `created-${++nextId}` }; },
  });
  let pending = Promise.resolve();
  const db = {
    collection: (name) => ref(name, "collection"),
    runTransaction: (work) => {
      const run = pending.then(async () => {
        const reads = new Set();
        const writes = [];
        const result = await work({
          get: async (target) => { reads.add(target.path); return { size: count }; },
          set: (target) => { assert(reads.has(target.path), "serialize writes through a previously read parent"); writes.push(["set", target.path]); },
          create: (target) => { writes.push(["create", target.path]); },
        });
        assert(writes.some(([op, p]) => op === "set" && p === "users/owner@example.com"));
        count += writes.filter(([op]) => op === "create").length;
        calls.push(...writes);
        return result;
      });
      pending = run.catch(() => {});
      return run;
    },
  };
  return { db, calls, count: () => count };
}

function loadWithDatabase(db, extra = {}) {
  return loadServer({
    "~/server/auth": { getServerAuthSession: async () => null },
    "~/lib/firebase-admin": { adminDb: db },
    ...extra,
  });
}

test("anonymous arbitrary collection reads and diagnostic queries are unavailable", async () => {
  const fixture = fixtureDatabase();
  const router = loadWithDatabase(fixture.db)("src/server/api/routers/firebase.ts").firebaseRouter;
  const caller = router.createCaller(context(null));
  await assert.rejects(caller.queryDocuments({ collectionName: "users/victim@example.com/uploaded_data" }), { code: "NOT_FOUND" });
  await assert.rejects(caller.testConnection(), { code: "NOT_FOUND" });
  await assert.rejects(caller.getUserDocuments({ subcollectionName: "uploaded_data" }), { code: "UNAUTHORIZED" });
  assert.deepEqual(fixture.calls, []);
});

test("user routes stay within the caller's script collection", async () => {
  const fixture = fixtureDatabase();
  const router = loadWithDatabase(fixture.db)("src/server/api/routers/firebase.ts").firebaseRouter;
  const caller = router.createCaller(context(session));
  await assert.rejects(caller.deleteUserDocument({ subcollectionName: "usage", documentId: "2026-11" }), { code: "BAD_REQUEST" });
  await assert.rejects(caller.deleteUserDocument({ subcollectionName: "uploaded_data", documentId: "show/nested/record" }), { code: "BAD_REQUEST" });
  assert.deepEqual(fixture.calls, []);
  assert.equal((await caller.getUserDocuments({ subcollectionName: "uploaded_data" })).success, true);
  assert.deepEqual(fixture.calls, [["get", "users/owner@example.com/uploaded_data"]]);
  await caller.deleteUserDocument({ subcollectionName: "uploaded_data", documentId: "show" });
  assert.deepEqual(fixture.calls.at(-1), ["delete", "users/owner@example.com/uploaded_data/show"]);
  await assert.rejects(router.createCaller(context({ user: {} })).getUserDocuments({ subcollectionName: "uploaded_data" }), { code: "UNAUTHORIZED" });
});

test("only matching verified provider emails create usable sessions", async () => {
  const { authOptions } = loadServer({ "~/env": { env: {} } })("src/server/auth.ts");
  const { signIn, jwt } = authOptions.callbacks;
  for (const [provider, field] of [["google", "email_verified"], ["discord", "verified"]]) {
    const account = { provider, providerAccountId: "provider-id", access_token: "unused-secret" };
    const profile = { email: "owner@example.com", [field]: true };
    const user = { email: "owner@example.com" };
    assert.equal(await signIn({ account, profile, user }), true);
    assert.equal(await signIn({ account, profile: { ...profile, [field]: false }, user }), false);
    assert.equal(await signIn({ account, profile: { email: profile.email }, user }), false);
    assert.equal(await signIn({ account, profile, user: { email: "victim@example.com" } }), false);
    const token = await jwt({ token: { email: user.email, accessToken: "legacy-secret" }, account, profile });
    assert.equal(token.emailVerified, true);
    assert.equal(token.id, "provider-id");
    assert.equal(token.accessToken, undefined);
    assert.equal(await jwt({ token }), token);
    assert.throws(() => jwt({ token: { email: user.email }, account, profile: { ...profile, [field]: false } }));
  }
  assert.throws(() => jwt({ token: { email: "owner@example.com" } }));
  assert.equal(authOptions.debug, false);
});

test("local script names cannot write outside the script directory", async () => {
  const writes = [];
  const load = loadWithDatabase(fixtureDatabase().db, {
    fs: { ...fs, existsSync: () => true, writeFileSync: (name) => writes.push(name) },
    "~/lib/sources": { LOCAL_SOURCE_ENABLED: true, DEMO_PROJECT: "demo" },
  });
  const { ScriptService } = load("src/server/scriptService.ts");
  for (const name of ["../../package", "..\\..\\package", "", "bad\0name"]) {
    assert.equal((await ScriptService.saveScript(name, "Scene", [], "local")).success, false);
  }
  assert.deepEqual(writes, []);
  assert.equal((await ScriptService.saveScript("My Show", "Scene", [], "local")).success, true);
  assert.deepEqual(writes, [path.join(root, "data/sceneData/my-show.json")]);
});

test("NextAuth clears legacy sessions without verified email evidence", async () => {
  const { authOptions } = loadServer({ "~/env": { env: {} } })("src/server/auth.ts");
  const sessionHandler = require(path.join(path.dirname(require.resolve("next-auth")), "core/routes/session.js")).default;
  const cleared = [{ name: "session-cookie", value: "", options: { maxAge: 0 } }];
  const response = await sessionHandler({
    options: {
      callbacks: authOptions.callbacks,
      session: { strategy: "jwt", maxAge: 3600 },
      jwt: { decode: async () => ({ email: "owner@example.com", id: "legacy" }) },
      events: {},
      logger: { error() {} },
    },
    sessionStore: { value: "synthetic-cookie", clean: () => cleared },
  });
  assert.deepEqual(response.body, {});
  assert.deepEqual(response.cookies, cleared);
});

test("concurrent show creation cannot claim the same last slot", async () => {
  const fixture = fixtureDatabase();
  const { FirestoreService } = loadWithDatabase(fixture.db)("src/server/firebase.ts");
  const results = await Promise.allSettled(Array.from({ length: 2 }, () => FirestoreService.addUserDocument("owner@example.com", "uploaded_data", { project: "Fixture", scenes: [] })));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.code, "FORBIDDEN");
  assert.equal(fixture.count(), 50);
});
