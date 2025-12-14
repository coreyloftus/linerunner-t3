/**
 * Firestore Backup and Migration Script
 *
 * This script:
 * 1. Exports all script data from Firestore (users and public collections)
 * 2. Saves them locally as JSON backups with timestamps
 * 3. Migrates the data from `character: string` to `characters: string[]` format
 * 4. Optionally uploads the migrated data back to Firestore
 *
 * Usage:
 *   npx tsx scripts/backup-and-migrate-firestore.ts backup     # Export only
 *   npx tsx scripts/backup-and-migrate-firestore.ts migrate    # Migrate local backup
 *   npx tsx scripts/backup-and-migrate-firestore.ts upload     # Upload migrated data
 *   npx tsx scripts/backup-and-migrate-firestore.ts all        # Do all steps
 */

import * as fs from "fs";
import * as path from "path";
import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

// Types for old schema
interface OldLine {
  character: string;
  line: string;
  sung?: boolean;
}

interface OldScene {
  title: string;
  lines: OldLine[];
}

interface OldProjectJSON {
  project: string;
  scenes: OldScene[];
  id?: string;
}

// Types for new schema
interface NewLine {
  characters: string[];
  line: string;
  sung?: boolean;
}

interface NewScene {
  title: string;
  lines: NewLine[];
}

interface NewProjectJSON {
  project: string;
  scenes: NewScene[];
  id?: string;
}

// Backup structure
interface BackupData {
  timestamp: string;
  users: Record<string, OldProjectJSON[]>;
  public: OldProjectJSON[];
}

interface MigratedData {
  timestamp: string;
  originalBackupFile: string;
  users: Record<string, NewProjectJSON[]>;
  public: NewProjectJSON[];
}

// Initialize Firebase Admin
function initFirebase(): Firestore {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID environment variable is not set");
  }

  try {
    const decodedKey = Buffer.from(serviceAccountKey, "base64").toString();
    const rawServiceAccount = JSON.parse(decodedKey) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    const serviceAccount: ServiceAccount = {
      projectId: rawServiceAccount.project_id,
      clientEmail: rawServiceAccount.client_email,
      privateKey: rawServiceAccount.private_key,
    };

    const app = getApps().length === 0
      ? initializeApp({ credential: cert(serviceAccount), projectId })
      : getApps()[0]!;

    // Use the "scripts" database as configured in the app
    return getFirestore(app, "scripts");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
}

// Get all user IDs from the users collection
async function getAllUserIds(db: Firestore): Promise<string[]> {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.listDocuments();
  return snapshot.map((doc) => doc.id);
}

// Get all scripts for a user
async function getUserScripts(db: Firestore, userId: string): Promise<OldProjectJSON[]> {
  const userDocRef = db.collection("users").doc(userId);
  const subcollectionRef = userDocRef.collection("uploaded_data");
  const snapshot = await subcollectionRef.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as OldProjectJSON[];
}

// Get public scripts
async function getPublicScripts(db: Firestore): Promise<OldProjectJSON[]> {
  const publicDocRef = db.collection("public").doc("public_scripts");
  const subcollectionRef = publicDocRef.collection("uploaded_data");
  const snapshot = await subcollectionRef.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as OldProjectJSON[];
}

// Backup all data from Firestore
async function backupFirestore(): Promise<string> {
  console.log("🔄 Starting Firestore backup...\n");

  const db = initFirebase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "scripts", "backups");

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData: BackupData = {
    timestamp,
    users: {},
    public: [],
  };

  // Get all user IDs
  console.log("📋 Fetching user list...");
  const userIds = await getAllUserIds(db);
  console.log(`   Found ${userIds.length} users\n`);

  // Fetch scripts for each user
  for (const userId of userIds) {
    console.log(`👤 Fetching scripts for user: ${userId}`);
    const scripts = await getUserScripts(db, userId);
    backupData.users[userId] = scripts;
    console.log(`   Found ${scripts.length} project documents`);

    // Log scene count
    const totalScenes = scripts.reduce((acc, proj) => acc + (proj.scenes?.length ?? 0), 0);
    const totalLines = scripts.reduce((acc, proj) =>
      acc + (proj.scenes?.reduce((sAcc, scene) => sAcc + (scene.lines?.length ?? 0), 0) ?? 0), 0);
    console.log(`   Total scenes: ${totalScenes}, Total lines: ${totalLines}\n`);
  }

  // Fetch public scripts
  console.log("📁 Fetching public scripts...");
  backupData.public = await getPublicScripts(db);
  console.log(`   Found ${backupData.public.length} public project documents\n`);

  // Save backup to file
  const backupFileName = `firestore-backup-${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
  console.log(`✅ Backup saved to: ${backupFilePath}\n`);

  return backupFilePath;
}

// Migrate a single line from old to new format
function migrateLine(oldLine: OldLine): NewLine {
  return {
    characters: [oldLine.character],
    line: oldLine.line,
    ...(oldLine.sung !== undefined && { sung: oldLine.sung }),
  };
}

// Migrate a scene from old to new format
function migrateScene(oldScene: OldScene): NewScene {
  return {
    title: oldScene.title,
    lines: oldScene.lines.map(migrateLine),
  };
}

// Migrate a project from old to new format
function migrateProject(oldProject: OldProjectJSON): NewProjectJSON {
  return {
    project: oldProject.project,
    scenes: oldProject.scenes.map(migrateScene),
    ...(oldProject.id && { id: oldProject.id }),
  };
}

// Migrate backup data to new format
function migrateBackupData(backupFilePath: string): string {
  console.log("🔄 Starting migration...\n");

  // Read backup file
  const backupData: BackupData = JSON.parse(fs.readFileSync(backupFilePath, "utf-8"));
  console.log(`📖 Loaded backup from: ${backupFilePath}\n`);

  const migratedData: MigratedData = {
    timestamp: new Date().toISOString().replace(/[:.]/g, "-"),
    originalBackupFile: path.basename(backupFilePath),
    users: {},
    public: [],
  };

  // Migrate user data
  let totalProjectsMigrated = 0;
  let totalScenesMigrated = 0;
  let totalLinesMigrated = 0;

  for (const [userId, projects] of Object.entries(backupData.users)) {
    console.log(`👤 Migrating user: ${userId}`);
    migratedData.users[userId] = projects.map((project) => {
      const migrated = migrateProject(project);
      totalProjectsMigrated++;
      totalScenesMigrated += migrated.scenes.length;
      totalLinesMigrated += migrated.scenes.reduce((acc, scene) => acc + scene.lines.length, 0);
      return migrated;
    });
    console.log(`   Migrated ${projects.length} projects\n`);
  }

  // Migrate public data
  console.log("📁 Migrating public scripts...");
  migratedData.public = backupData.public.map((project) => {
    const migrated = migrateProject(project);
    totalProjectsMigrated++;
    totalScenesMigrated += migrated.scenes.length;
    totalLinesMigrated += migrated.scenes.reduce((acc, scene) => acc + scene.lines.length, 0);
    return migrated;
  });
  console.log(`   Migrated ${backupData.public.length} projects\n`);

  // Save migrated data
  const backupDir = path.dirname(backupFilePath);
  const migratedFileName = `firestore-migrated-${migratedData.timestamp}.json`;
  const migratedFilePath = path.join(backupDir, migratedFileName);

  fs.writeFileSync(migratedFilePath, JSON.stringify(migratedData, null, 2));

  console.log("📊 Migration Summary:");
  console.log(`   Projects migrated: ${totalProjectsMigrated}`);
  console.log(`   Scenes migrated: ${totalScenesMigrated}`);
  console.log(`   Lines migrated: ${totalLinesMigrated}`);
  console.log(`\n✅ Migrated data saved to: ${migratedFilePath}\n`);

  return migratedFilePath;
}

// Upload migrated data back to Firestore
async function uploadMigratedData(migratedFilePath: string): Promise<void> {
  console.log("🔄 Starting upload of migrated data...\n");

  const db = initFirebase();
  const migratedData: MigratedData = JSON.parse(fs.readFileSync(migratedFilePath, "utf-8"));

  console.log(`📖 Loaded migrated data from: ${migratedFilePath}\n`);

  // Upload user data
  for (const [userId, projects] of Object.entries(migratedData.users)) {
    console.log(`👤 Uploading data for user: ${userId}`);
    const userDocRef = db.collection("users").doc(userId);
    const subcollectionRef = userDocRef.collection("uploaded_data");

    for (const project of projects) {
      const { id, ...projectData } = project;
      if (id) {
        // Update existing document
        await subcollectionRef.doc(id).set(projectData);
        console.log(`   Updated project: ${project.project} (${id})`);
      } else {
        // Create new document
        const newDoc = await subcollectionRef.add(projectData);
        console.log(`   Created project: ${project.project} (${newDoc.id})`);
      }
    }
    console.log("");
  }

  // Upload public data
  console.log("📁 Uploading public scripts...");
  const publicDocRef = db.collection("public").doc("public_scripts");
  const publicSubcollectionRef = publicDocRef.collection("uploaded_data");

  for (const project of migratedData.public) {
    const { id, ...projectData } = project;
    if (id) {
      await publicSubcollectionRef.doc(id).set(projectData);
      console.log(`   Updated project: ${project.project} (${id})`);
    } else {
      const newDoc = await publicSubcollectionRef.add(projectData);
      console.log(`   Created project: ${project.project} (${newDoc.id})`);
    }
  }

  console.log("\n✅ Upload complete!\n");
}

// Find the most recent backup file
function findLatestBackup(): string | null {
  const backupDir = path.join(process.cwd(), "scripts", "backups");

  if (!fs.existsSync(backupDir)) {
    return null;
  }

  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith("firestore-backup-") && f.endsWith(".json"))
    .sort()
    .reverse();

  const latestFile = files[0];
  return latestFile ? path.join(backupDir, latestFile) : null;
}

// Find the most recent migrated file
function findLatestMigrated(): string | null {
  const backupDir = path.join(process.cwd(), "scripts", "backups");

  if (!fs.existsSync(backupDir)) {
    return null;
  }

  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith("firestore-migrated-") && f.endsWith(".json"))
    .sort()
    .reverse();

  const latestFile = files[0];
  return latestFile ? path.join(backupDir, latestFile) : null;
}

// Main function
async function main() {
  const command = process.argv[2] ?? "backup";

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Firestore Backup and Migration Tool");
  console.log("  Character field migration: character -> characters[]");
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    switch (command) {
      case "backup": {
        await backupFirestore();
        break;
      }

      case "migrate": {
        const backupFile = findLatestBackup();
        if (!backupFile) {
          console.error("❌ No backup file found. Run 'backup' command first.");
          process.exit(1);
        }
        migrateBackupData(backupFile);
        break;
      }

      case "upload": {
        const migratedFile = findLatestMigrated();
        if (!migratedFile) {
          console.error("❌ No migrated file found. Run 'migrate' command first.");
          process.exit(1);
        }

        console.log("⚠️  WARNING: This will overwrite data in Firestore!");
        console.log("   Make sure you have a backup before proceeding.\n");
        console.log("   Press Ctrl+C within 5 seconds to cancel...\n");

        await new Promise((resolve) => setTimeout(resolve, 5000));
        await uploadMigratedData(migratedFile);
        break;
      }

      case "all": {
        const backupPath = await backupFirestore();
        const migratedPath = migrateBackupData(backupPath);

        console.log("⚠️  WARNING: This will overwrite data in Firestore!");
        console.log("   Press Ctrl+C within 5 seconds to cancel...\n");

        await new Promise((resolve) => setTimeout(resolve, 5000));
        await uploadMigratedData(migratedPath);
        break;
      }

      default:
        console.log("Usage:");
        console.log("  npx tsx scripts/backup-and-migrate-firestore.ts backup   # Export only");
        console.log("  npx tsx scripts/backup-and-migrate-firestore.ts migrate  # Migrate local backup");
        console.log("  npx tsx scripts/backup-and-migrate-firestore.ts upload   # Upload migrated data");
        console.log("  npx tsx scripts/backup-and-migrate-firestore.ts all      # Do all steps");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
