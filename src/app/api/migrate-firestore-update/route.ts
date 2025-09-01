/**
 * SAFE API endpoint to update Firestore documents with missing characters arrays
 * 
 * SAFETY FEATURES:
 * - Admin-only access (requires coreyloftus@gmail.com)
 * - Only adds missing characters field
 * - Never modifies or deletes existing data
 * - Detailed logging of all operations
 * - Returns detailed results
 */

import { adminDb } from '~/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/server/auth';

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

export async function POST() {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'coreyloftus@gmail.com') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Admin access required' 
      }, { status: 403 });
    }

    console.log('🚀 Starting SAFE Firestore characters migration...');
    console.log(`👤 Authorized user: ${session.user.email}`);

    const results = {
      totalDocuments: 0,
      documentsUpdated: 0,
      documentsSkipped: 0,
      documentsErrored: 0,
      updates: [] as Array<{
        path: string;
        projectName: string;
        status: 'updated' | 'skipped' | 'error';
        charactersAdded?: string[];
        error?: string;
      }>
    };

    // Find documents that need updating
    const usersSnapshot = await adminDb.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`📁 Processing user: ${userId}`);
      
      const uploadedDataSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('uploaded_data')
        .get();
      
      for (const scriptDoc of uploadedDataSnapshot.docs) {
        results.totalDocuments++;
        const docPath = `users/${userId}/uploaded_data/${scriptDoc.id}`;
        const data = scriptDoc.data() as ProjectData;
        
        console.log(`📄 Processing: ${docPath} - "${data.project}"`);
        
        try {
          if (!data.characters && data.scenes) {
            // Document needs characters array
            const calculatedCharacters = generateCharactersFromScenes(data.scenes);
            
            console.log(`🔄 Adding characters: [${calculatedCharacters.join(', ')}]`);
            
            // SAFE UPDATE: Only add characters field, preserve all other data
            await scriptDoc.ref.update({
              characters: calculatedCharacters
            });
            
            results.documentsUpdated++;
            results.updates.push({
              path: docPath,
              projectName: data.project,
              status: 'updated',
              charactersAdded: calculatedCharacters
            });
            
            console.log(`✅ Successfully updated: ${docPath}`);
            
          } else if (data.characters) {
            // Document already has characters array
            results.documentsSkipped++;
            results.updates.push({
              path: docPath,
              projectName: data.project,
              status: 'skipped'
            });
            
            console.log(`⏭️ Skipped (already has characters): ${docPath}`);
            
          } else {
            // Document has no scenes data
            results.documentsSkipped++;
            results.updates.push({
              path: docPath,
              projectName: data.project,
              status: 'skipped'
            });
            
            console.log(`⚠️ Skipped (no scenes data): ${docPath}`);
          }
          
        } catch (error) {
          console.error(`❌ Error updating ${docPath}:`, error);
          results.documentsErrored++;
          results.updates.push({
            path: docPath,
            projectName: data.project,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Also process public scripts
    console.log(`📁 Processing public scripts...`);
    const publicSnapshot = await adminDb.collection('public_scripts').get();
    
    for (const scriptDoc of publicSnapshot.docs) {
      results.totalDocuments++;
      const docPath = `public_scripts/${scriptDoc.id}`;
      const data = scriptDoc.data() as ProjectData;
      
      console.log(`📄 Processing: ${docPath} - "${data.project}"`);
      
      try {
        if (!data.characters && data.scenes) {
          const calculatedCharacters = generateCharactersFromScenes(data.scenes);
          
          console.log(`🔄 Adding characters: [${calculatedCharacters.join(', ')}]`);
          
          await scriptDoc.ref.update({
            characters: calculatedCharacters
          });
          
          results.documentsUpdated++;
          results.updates.push({
            path: docPath,
            projectName: data.project,
            status: 'updated',
            charactersAdded: calculatedCharacters
          });
          
          console.log(`✅ Successfully updated: ${docPath}`);
          
        } else if (data.characters) {
          results.documentsSkipped++;
          results.updates.push({
            path: docPath,
            projectName: data.project,
            status: 'skipped'
          });
          
          console.log(`⏭️ Skipped (already has characters): ${docPath}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${docPath}:`, error);
        results.documentsErrored++;
        results.updates.push({
          path: docPath,
          projectName: data.project,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎉 MIGRATION COMPLETE!`);
    console.log(`📊 Results: ${results.documentsUpdated} updated, ${results.documentsSkipped} skipped, ${results.documentsErrored} errored`);

    return NextResponse.json({
      success: true,
      results,
      message: `Migration complete! Updated ${results.documentsUpdated} documents, skipped ${results.documentsSkipped}, ${results.documentsErrored} errors.`
    });

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}