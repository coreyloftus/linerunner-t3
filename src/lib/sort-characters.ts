import { adminDb } from "~/lib/firebase-admin";

interface DocumentData {
  characters?: string[];
  [key: string]: unknown;
}

export async function sortCharactersInDocument(
  userId: string,
  documentId: string
): Promise<{ success: boolean; message: string; originalCharacters?: string[]; sortedCharacters?: string[] }> {
  try {
    console.log(`🔧 Sorting characters in document: users/${userId}/uploaded_data/${documentId}`);
    
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

    const data = docSnapshot.data() as DocumentData;
    
    if (!data.characters || !Array.isArray(data.characters)) {
      return {
        success: false,
        message: "No characters array found in document"
      };
    }

    const originalCharacters = [...data.characters];
    const sortedCharacters = [...data.characters].sort();
    
    // Check if sorting is needed
    const isAlreadySorted = JSON.stringify(originalCharacters) === JSON.stringify(sortedCharacters);
    
    if (isAlreadySorted) {
      return {
        success: true,
        message: "Characters array is already sorted",
        originalCharacters,
        sortedCharacters
      };
    }

    // Update the document with sorted characters
    await docRef.update({
      characters: sortedCharacters
    });

    console.log(`✅ Successfully sorted characters array`);
    console.log(`   Original: [${originalCharacters.join(', ')}]`);
    console.log(`   Sorted: [${sortedCharacters.join(', ')}]`);

    return {
      success: true,
      message: "Characters array sorted successfully",
      originalCharacters,
      sortedCharacters
    };

  } catch (error) {
    console.error("❌ Error sorting characters:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}