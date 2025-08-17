/**
 * API endpoint to safely preview Firestore migration
 * This will scan Firestore and show what documents need characters arrays
 * WITHOUT making any changes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '~/lib/firebase-admin';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const preview = {
      totalDocuments: 0,
      documentsNeedingUpdate: 0,
      documentsUpToDate: 0,
      updatesNeeded: [] as Array<{
        path: string;
        projectName: string;
        currentCharacters: string[] | undefined;
        calculatedCharacters: string[];
      }>
    };

    console.log('🔍 Starting Firestore preview scan...');

    // Scan all user collections
    const usersSnapshot = await adminDb.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`📁 Checking user: ${userId}`);
      
      // Check uploaded_data subcollection
      const uploadedDataSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('uploaded_data')
        .get();
      
      for (const scriptDoc of uploadedDataSnapshot.docs) {
        preview.totalDocuments++;
        const docPath = `users/${userId}/uploaded_data/${scriptDoc.id}`;
        const data = scriptDoc.data() as ProjectData;
        
        console.log(`📄 Document: ${docPath} - Project: "${data.project}"`);
        
        if (!data.characters && data.scenes) {
          preview.documentsNeedingUpdate++;
          const calculatedCharacters = generateCharactersFromScenes(data.scenes);
          console.log(`🔄 Needs update: [${calculatedCharacters.join(', ')}]`);
          
          preview.updatesNeeded.push({
            path: docPath,
            projectName: data.project,
            currentCharacters: data.characters,
            calculatedCharacters
          });
        } else if (data.characters) {
          preview.documentsUpToDate++;
          console.log(`✅ Already has characters field`);
        }
      }
    }

    // Check public scripts collection
    console.log(`📁 Checking public scripts...`);
    const publicSnapshot = await adminDb.collection('public_scripts').get();
    
    for (const scriptDoc of publicSnapshot.docs) {
      preview.totalDocuments++;
      const docPath = `public_scripts/${scriptDoc.id}`;
      const data = scriptDoc.data() as ProjectData;
      
      console.log(`📄 Document: ${docPath} - Project: "${data.project}"`);
      
      if (!data.characters && data.scenes) {
        preview.documentsNeedingUpdate++;
        const calculatedCharacters = generateCharactersFromScenes(data.scenes);
        console.log(`🔄 Needs update: [${calculatedCharacters.join(', ')}]`);
        
        preview.updatesNeeded.push({
          path: docPath,
          projectName: data.project,
          currentCharacters: data.characters,
          calculatedCharacters
        });
      } else if (data.characters) {
        preview.documentsUpToDate++;
        console.log(`✅ Already has characters field`);
      }
    }

    console.log(`📊 SUMMARY: ${preview.totalDocuments} total, ${preview.documentsNeedingUpdate} need updates, ${preview.documentsUpToDate} up-to-date`);

    return res.status(200).json({
      success: true,
      preview,
      message: `Found ${preview.totalDocuments} documents. ${preview.documentsNeedingUpdate} need characters arrays added.`
    });

  } catch (error) {
    console.error('❌ Preview failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}