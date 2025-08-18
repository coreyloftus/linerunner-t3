import { type NextRequest, NextResponse } from "next/server";
import { 
  migrateCharactersForDocument, 
  migrateCharactersForAllDocuments 
} from "~/lib/migrate-characters";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string;
      documentId?: string;
      migrateAll?: boolean;
    };

    const { userId, documentId, migrateAll } = body;

    if (migrateAll) {
      // Migrate all documents
      const result = await migrateCharactersForAllDocuments();
      
      if (result.success) {
        return NextResponse.json(result, { status: 200 });
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    } else {
      // Migrate specific document
      if (!userId || !documentId) {
        return NextResponse.json(
          { error: "Missing required parameters: userId and documentId (or set migrateAll: true)" },
          { status: 400 }
        );
      }

      const result = await migrateCharactersForDocument(userId, documentId);
      
      if (result.success) {
        return NextResponse.json(result, { status: 200 });
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}