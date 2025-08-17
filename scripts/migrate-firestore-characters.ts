#!/usr/bin/env node
/**
 * SAFE Firestore Migration Script
 * 
 * This script ONLY UPDATES existing Firestore documents to add missing characters arrays.
 * It will NEVER delete or modify existing data.
 * 
 * Safety features:
 * - Read-only preview mode by default
 * - Only adds characters field if missing
 * - Preserves all existing document data
 * - Detailed logging of all operations
 * - Confirmation prompt before making changes
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

interface SceneData {
  title: string;
  lines: LineData[];
}

interface LineData {
  character: string;
  line: string;
  sung?: boolean;
}

interface ProjectData {
  project: string;
  scenes: SceneData[];
  characters?: string[];
}

function generateCharactersFromScenes(scenes: SceneData[]): string[] {
  const charactersSet = new Set<string>();
  scenes.forEach(scene => {
    scene.lines.forEach(line => {
      charactersSet.add(line.character);
    });
  });
  return Array.from(charactersSet).sort();
}

async function initializeFirebase() {
  try {
    if (getApps().length === 0) {
      // Use the same approach as the main app
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
      }

      const decodedKey = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        "base64",
      ).toString();
      const serviceAccount = JSON.parse(decodedKey);
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    // Use the scripts database like the main app
    const db = getFirestore(undefined, "scripts");
    console.log('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
}

async function previewChanges(db: any) {
  console.log('\n🔍 PREVIEW MODE: Scanning Firestore documents...\n');
  
  let totalDocuments = 0;
  let documentsNeedingUpdate = 0;
  const updatesNeeded: Array<{
    path: string;
    projectName: string;
    currentCharacters: string[] | undefined;
    calculatedCharacters: string[];
  }> = [];

  try {
    // Scan all user collections
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`📁 Checking user: ${userId}`);
      
      // Check uploaded_data subcollection
      const uploadedDataSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('uploaded_data')
        .get();
      
      for (const scriptDoc of uploadedDataSnapshot.docs) {
        totalDocuments++;
        const docPath = `users/${userId}/uploaded_data/${scriptDoc.id}`;
        const data = scriptDoc.data() as ProjectData;
        
        console.log(`  📄 Document: ${docPath}`);
        console.log(`    Project: "${data.project}"`);
        console.log(`    Scenes: ${data.scenes?.length || 0}`);
        console.log(`    Current characters field: ${data.characters ? `[${data.characters.join(', ')}]` : 'MISSING'}`);
        
        if (!data.characters && data.scenes) {
          documentsNeedingUpdate++;
          const calculatedCharacters = generateCharactersFromScenes(data.scenes);
          console.log(`    🔄 Would add characters: [${calculatedCharacters.join(', ')}]`);
          
          updatesNeeded.push({
            path: docPath,
            projectName: data.project,
            currentCharacters: data.characters,
            calculatedCharacters
          });
        } else if (data.characters) {
          console.log(`    ✅ Already has characters field`);
        } else {
          console.log(`    ⚠️  No scenes data found`);
        }
        
        console.log('');
      }
    }

    // Check public scripts collection
    console.log(`📁 Checking public scripts...`);
    const publicSnapshot = await db.collection('public_scripts').get();
    
    for (const scriptDoc of publicSnapshot.docs) {
      totalDocuments++;
      const docPath = `public_scripts/${scriptDoc.id}`;
      const data = scriptDoc.data() as ProjectData;
      
      console.log(`  📄 Document: ${docPath}`);
      console.log(`    Project: "${data.project}"`);
      console.log(`    Scenes: ${data.scenes?.length || 0}`);
      console.log(`    Current characters field: ${data.characters ? `[${data.characters.join(', ')}]` : 'MISSING'}`);
      
      if (!data.characters && data.scenes) {
        documentsNeedingUpdate++;
        const calculatedCharacters = generateCharactersFromScenes(data.scenes);
        console.log(`    🔄 Would add characters: [${calculatedCharacters.join(', ')}]`);
        
        updatesNeeded.push({
          path: docPath,
          projectName: data.project,
          currentCharacters: data.characters,
          calculatedCharacters
        });
      } else if (data.characters) {
        console.log(`    ✅ Already has characters field`);
      } else {
        console.log(`    ⚠️  No scenes data found`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error during preview:', error);
    throw error;
  }

  console.log('\n📊 SUMMARY:');
  console.log(`📄 Total documents scanned: ${totalDocuments}`);
  console.log(`🔄 Documents needing update: ${documentsNeedingUpdate}`);
  console.log(`✅ Documents already up-to-date: ${totalDocuments - documentsNeedingUpdate}`);

  return updatesNeeded;
}

async function promptConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n⚠️  Do you want to proceed with updating these documents? (type "yes" to confirm): ', (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function performUpdates(db: any, updatesNeeded: Array<{
  path: string;
  projectName: string;
  currentCharacters: string[] | undefined;
  calculatedCharacters: string[];
}>) {
  console.log('\n🚀 Starting safe updates...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const update of updatesNeeded) {
    try {
      console.log(`📝 Updating: ${update.path}`);
      console.log(`   Project: "${update.projectName}"`);
      console.log(`   Adding characters: [${update.calculatedCharacters.join(', ')}]`);

      // Parse the path to get collection and document references
      const pathParts = update.path.split('/');
      let docRef;

      if (pathParts[0] === 'users') {
        // users/{userId}/uploaded_data/{docId}
        docRef = db.collection('users').doc(pathParts[1]).collection('uploaded_data').doc(pathParts[3]);
      } else if (pathParts[0] === 'public_scripts') {
        // public_scripts/{docId}
        docRef = db.collection('public_scripts').doc(pathParts[1]);
      } else {
        throw new Error(`Unknown path format: ${update.path}`);
      }

      // SAFE UPDATE: Only add the characters field, preserve all other data
      await docRef.update({
        characters: update.calculatedCharacters
      });

      console.log(`   ✅ Successfully updated\n`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Failed to update: ${error}\n`);
      errorCount++;
    }
  }

  console.log('🎉 UPDATE COMPLETE!');
  console.log(`✅ Successfully updated: ${successCount} documents`);
  console.log(`❌ Failed updates: ${errorCount} documents`);
}

async function main() {
  console.log('🔧 Safe Firestore Characters Migration Tool');
  console.log('==========================================\n');

  try {
    const db = await initializeFirebase();
    
    // Always run preview first
    const updatesNeeded = await previewChanges(db);
    
    if (updatesNeeded.length === 0) {
      console.log('\n🎉 All documents already have characters arrays! No updates needed.');
      return;
    }

    // Prompt for confirmation
    const confirmed = await promptConfirmation();
    
    if (!confirmed) {
      console.log('\n❌ Operation cancelled by user.');
      return;
    }

    // Perform the updates
    await performUpdates(db, updatesNeeded);

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the script if it's the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateCharactersFromScenes, initializeFirebase };