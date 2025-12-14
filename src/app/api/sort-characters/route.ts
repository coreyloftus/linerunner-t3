import { type NextRequest, NextResponse } from "next/server";
import { sortCharactersInDocument } from "~/lib/sort-characters";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string;
      documentId?: string;
    };

    const { userId, documentId } = body;

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: "Missing required parameters: userId and documentId" },
        { status: 400 }
      );
    }

    const result = await sortCharactersInDocument(userId, documentId);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
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