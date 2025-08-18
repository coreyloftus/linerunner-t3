import { adminDb } from "~/lib/firebase-admin";

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

export function generateCharactersFromScenes(scenes: SceneData[]): string[] {
  const charactersSet = new Set<string>();
  scenes.forEach(scene => {
    scene.lines.forEach(line => {
      charactersSet.add(line.character);
    });
  });
  return Array.from(charactersSet).sort();
}

export async function migrateCharactersForDocument(
  userId: string,
  documentId: string
): Promise<{ success: boolean; message: string; characters?: string[] }> {
  try {
    console.log(`🔧 Migrating characters for document: users/${userId}/uploaded_data/${documentId}`);
    
    // Get the document reference
    const docRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("uploaded_data")
      .doc(documentId);

    // Get the current document data
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return {
        success: false,
        message: "Document not found"
      };
    }

    const data = docSnapshot.data() as ProjectData;
    
    if (!data.scenes || !Array.isArray(data.scenes)) {
      return {
        success: false,
        message: "No scenes data found in document"
      };
    }

    // Generate sorted characters from scenes
    const sortedCharacters = generateCharactersFromScenes(data.scenes);
    
    if (data.characters && Array.isArray(data.characters)) {
      // Check if characters array is already up to date
      const existingCharactersSorted = [...data.characters].sort();
      const isUpToDate = JSON.stringify(existingCharactersSorted) === JSON.stringify(sortedCharacters);
      
      if (isUpToDate) {
        return {
          success: true,
          message: "Characters array is already up to date",
          characters: sortedCharacters
        };
      }
    }

    // Update the document with sorted characters
    await docRef.update({
      characters: sortedCharacters
    });

    console.log(`✅ Successfully migrated characters array`);
    console.log(`   Generated characters: [${sortedCharacters.join(', ')}]`);

    return {
      success: true,
      message: data.characters ? "Characters array updated successfully" : "Characters array added successfully",
      characters: sortedCharacters
    };

  } catch (error) {
    console.error("❌ Error migrating characters:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export async function migrateCharactersForAllDocuments(): Promise<{ 
  success: boolean; 
  message: string; 
  totalScanned: number;
  totalUpdated: number;
  errors: string[];
}> {
  try {
    console.log('🔧 Starting migration for all documents...');
    
    let totalScanned = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    // Scan all user collections
    const usersSnapshot = await adminDb.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`📁 Processing user: ${userId}`);
      
      // Check uploaded_data subcollection
      const uploadedDataSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('uploaded_data')
        .get();
      
      for (const scriptDoc of uploadedDataSnapshot.docs) {
        totalScanned++;
        const documentId = scriptDoc.id;
        
        try {
          const result = await migrateCharactersForDocument(userId, documentId);
          
          if (result.success && result.message.includes("updated") || result.message.includes("added")) {
            totalUpdated++;
          }
        } catch (error) {
          const errorMsg = `Error processing ${userId}/${documentId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    console.log(`✅ Migration complete. Scanned: ${totalScanned}, Updated: ${totalUpdated}, Errors: ${errors.length}`);

    return {
      success: true,
      message: `Migration completed. Scanned ${totalScanned} documents, updated ${totalUpdated}`,
      totalScanned,
      totalUpdated,
      errors
    };

  } catch (error) {
    console.error("❌ Error during migration:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      totalScanned: 0,
      totalUpdated: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"]
    };
  }
}