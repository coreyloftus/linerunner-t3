import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { initTRPC, TRPCError } = require("@trpc/server");
const root = new URL("../", import.meta.url);

// Execute the real modules with isolated storage, authentication, and paid providers.
function loadModule(path, mocks = {}) {
  const source = ts.transpileModule(readFileSync(new URL(path, root), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(source, {
    exports,
    require: (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith("~/")) return loadModule(`src/${name.slice(2)}.ts`, mocks);
      if (name.startsWith("./")) return loadModule(`src/lib/${name.slice(2)}.ts`, mocks);
      return require(name);
    },
    Buffer, Date, Response, Uint8Array, TextEncoder, console,
  }, { filename: path });
  return exports;
}

const email = "actor@example.test";
const input = { fileName: "audit.pdf", pdfBase64: Buffer.from("%PDF-1.7\n").toString("base64") };
const month = () => new Date().toISOString().slice(0, 7);

function importsFixture({ legacyCount = 0, failProvider = false, enabled = true } = {}) {
  const documents = new Map();
  if (legacyCount) documents.set(`users/${email}`, { pdfImports: { month: month(), count: legacyCount } });
  let pending = Promise.resolve();
  let nextId = 0;
  const queries = [];
  const snapshot = (ref) => ({ id: ref.id, exists: documents.has(ref.path), data: () => documents.get(ref.path) });
  const collectionRef = (path, fields, limit = Infinity) => ({
    path,
    collection: true,
    doc: (id = `melody-${++nextId}`) => {
      const ref = {
        id,
        path: `${path}/${id}`,
        get: async () => snapshot(ref),
        set: async (data) => documents.set(ref.path, data),
        delete: async () => documents.delete(ref.path),
        collection: (name) => collectionRef(`${ref.path}/${name}`),
      };
      return ref;
    },
    add: async (data) => {
      const ref = collectionRef(path).doc();
      await ref.set(data);
      return ref;
    },
    get: async () => {
      queries.push({ path, fields });
      const docs = [...documents].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
        .slice(0, limit).map(([key, data]) => ({ id: key.slice(path.length + 1), data: () => fields ? Object.fromEntries(Object.entries(data).filter(([field]) => fields.includes(field))) : data }));
      return { docs, size: docs.length };
    },
    limit: (count) => collectionRef(path, fields, count),
    select: (...projection) => collectionRef(path, projection, limit),
  });
  const adminDb = {
    collection: collectionRef,
    runTransaction: (fn) => {
      const result = pending.then(() => fn({
        get: async (ref) => ref.collection === true ? ref.get() : snapshot(ref),
        set: (ref, data, options) => documents.set(ref.path, options?.merge ? { ...documents.get(ref.path), ...data } : data),
        create: (ref, data) => documents.set(ref.path, data),
      }));
      pending = result.catch(() => {});
      return result;
    },
  };
  let providerCalls = 0;
  const extract = async () => {
    providerCalls++;
    if (failProvider) throw new TRPCError({ code: "BAD_REQUEST", message: "Model output cannot be used." });
    return { show: {}, melody: {}, warnings: [] };
  };
  const t = initTRPC.create();
  const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.user?.email) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next();
  });
  const mocks = {
    "~/env": { env: { ANTHROPIC_API_KEY: enabled ? "test-key" : undefined, NEXTAUTH_SECRET: "test-secret" } },
    "~/lib/firebase-admin": { adminDb },
    "~/server/api/trpc": { createTRPCRouter: t.router, publicProcedure: t.procedure, protectedProcedure, adminProcedure: protectedProcedure },
    "~/server/scriptService": { ScriptService: {} },
    "~/server/firebase": { FirestoreService: {} },
    "~/server/scriptExtraction": { extractScript: extract, scriptImportEnabled: () => enabled },
    "~/server/melodyExtraction": { extractMelody: extract },
  };
  const ctx = { session: { user: { email } } };
  const scripts = loadModule("src/server/api/routers/scriptData.ts", mocks).scriptData.createCaller(ctx);
  const melodies = loadModule("src/server/api/routers/melody.ts", mocks).melodyRouter.createCaller(ctx);
  return { documents, queries, scripts, melodies, providerCalls: () => providerCalls };
}

const melodyInput = {
  title: "Test melody", tempoBpm: 100, timeSignature: [4, 4],
  notes: [{ pitch: "C4", beats: 1, measure: 1 }], sourceFileName: "audit.pdf", extractionModel: "test",
};

test("concurrent melody creation stops at 50 while existing melodies can still be edited", async () => {
  const f = importsFixture();
  const results = await Promise.allSettled(Array.from({ length: 51 }, () => f.melodies.save(melodyInput)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 50);
  assert.equal(results.find((r) => r.status === "rejected").reason.code, "FORBIDDEN");
  const saved = results.find((r) => r.status === "fulfilled").value;
  await f.melodies.save({ ...melodyInput, id: saved.id, title: "Edited" });
  assert.equal((await f.melodies.get(saved)).title, "Edited");
  await f.melodies.delete(saved);
  await f.melodies.save(melodyInput);
});

test("melody summaries do not fetch notes and legacy entries do not report a false count", async () => {
  const f = importsFixture();
  const saved = await f.melodies.save(melodyInput);
  f.documents.set(`users/${email}/melodies/legacy`, { ...melodyInput, updatedAt: "2000-01-01", createdAt: "2000-01-01" });
  f.queries.length = 0;
  const summaries = await f.melodies.list();
  assert.equal(summaries.find((m) => m.id === saved.id).noteCount, 1);
  assert.equal(summaries.find((m) => m.id === "legacy").noteCount, undefined);
  assert.ok(f.queries.every((query) => query.fields && !query.fields.includes("notes") && !query.fields.includes("otherParts")));
});

test("melody IDs cannot address descendant documents and link metadata is bounded", async () => {
  const f = importsFixture();
  const nested = { id: "melody/children/other" };
  await assert.rejects(f.melodies.get(nested), { code: "BAD_REQUEST" });
  await assert.rejects(f.melodies.delete(nested), { code: "BAD_REQUEST" });
  await assert.rejects(f.melodies.save({ ...melodyInput, ...nested }), { code: "BAD_REQUEST" });
  await assert.rejects(f.melodies.save({ ...melodyInput, link: { projectName: "x".repeat(201), source: "user", sectionTitle: "Scene" } }), { code: "BAD_REQUEST" });
  assert.equal(f.documents.size, 0);
});

test("concurrent script and melody imports share one atomic monthly cap", async () => {
  const f = importsFixture();
  const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) =>
    (i % 2 ? f.scripts : f.melodies).extractFromPdf(input)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 10);
  assert.equal(f.providerCalls(), 10);
  for (const result of results.filter((r) => r.status === "rejected")) {
    assert.equal(result.reason.code, "TOO_MANY_REQUESTS");
  }
});

test("unusable paid responses consume attempts and deleting an account cannot reset them", async () => {
  const f = importsFixture({ failProvider: true });
  for (let i = 0; i < 10; i++) await assert.rejects(f.scripts.extractFromPdf(input), { code: "BAD_REQUEST" });
  f.documents.delete(`users/${email}`);
  await assert.rejects(f.melodies.extractFromPdf(input), { code: "TOO_MANY_REQUESTS" });
  assert.equal(f.providerCalls(), 10);
});

test("the new ledger preserves legacy allowance and contains no email or token", async () => {
  const f = importsFixture({ legacyCount: 9 });
  assert.equal((await f.scripts.pdfImportStatus()).remaining, 1);
  await f.melodies.extractFromPdf(input);
  assert.equal((await f.scripts.pdfImportStatus()).remaining, 0);
  const [path, ledger] = [...f.documents].find(([key]) => key.startsWith("pdfImportUsage/"));
  assert.match(path, /^pdfImportUsage\/[a-f0-9]{64}$/);
  assert.equal(ledger.count, 10);
  assert.deepEqual(Object.keys(ledger).sort(), ["count", "expiresAt", "month"]);
  assert.ok(ledger.expiresAt > new Date());
  assert.ok(!JSON.stringify([...f.documents].filter(([key]) => key.startsWith("pdfImportUsage/"))).includes(email));
  await assert.rejects(f.scripts.extractFromPdf(input), { code: "TOO_MANY_REQUESTS" });
});

test("an old monthly ledger does not consume the new month's allowance", async () => {
  const f = importsFixture();
  await f.melodies.extractFromPdf(input);
  const [path, ledger] = [...f.documents].find(([key]) => key.startsWith("pdfImportUsage/"));
  f.documents.set(path, { ...ledger, month: "2000-01", count: 10 });
  assert.equal((await f.scripts.extractFromPdf(input)).remaining, 9);
});

test("missing configuration and malformed or oversized PDFs never charge quota or call a provider", async () => {
  const off = importsFixture({ enabled: false });
  await assert.rejects(off.melodies.extractFromPdf(input), { code: "PRECONDITION_FAILED" });
  assert.equal(off.documents.size, 0);
  const f = importsFixture();
  for (const pdfBase64 of [
    input.pdfBase64 + " ",
    input.pdfBase64 + "A".repeat(4 * 1024 * 1024),
    "JVBERi0xLjcK=",
    Buffer.from("Not a PDF").toString("base64"),
  ]) {
    await assert.rejects(f.melodies.extractFromPdf({ ...input, pdfBase64 }), { code: "BAD_REQUEST" });
    await assert.rejects(f.scripts.extractFromPdf({ ...input, pdfBase64 }), { code: "BAD_REQUEST" });
  }
  assert.equal(f.documents.size, 0);
  assert.equal(f.providerCalls(), 0);
  assert.equal(off.providerCalls(), 0);
});

test("audio suffix ranges return the final bytes and invalid ranges return 416", async () => {
  const { GET } = loadModule("src/app/api/line-audio/[...path]/route.ts", {
    "~/server/auth": { getServerAuthSession: async () => ({ user: { email } }) },
    "@vercel/blob": { get: async () => ({ statusCode: 200, blob: { contentType: "audio/mpeg" }, stream: new Response("0123456789").body }) },
  });
  const request = (range) => GET(new Request("https://example.test/audio", { headers: { range } }), {
    params: Promise.resolve({ path: ["show", "abc.mp3"] }),
  });
  for (const [range, expected] of [["bytes=-3", "789"], ["bytes=2-4", "234"], ["bytes=9-", "9"], ["bytes=-20", "0123456789"]]) {
    const response = await request(range);
    assert.equal(response.status, 206);
    assert.equal(await response.text(), expected);
  }
  for (const range of ["bytes=-", "bytes=-0", "bytes=10-", "bytes=5-2", "bytes=9007199254740992-"]) {
    const response = await request(range);
    assert.equal(response.status, 416);
    assert.equal(response.headers.get("content-range"), "bytes */10");
  }
});
