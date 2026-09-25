import { NextResponse } from "next/server";
import { startRequestProcessing } from "@/lib/request-processing";

export async function POST(_request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  try {
    const result = await startRequestProcessing(requestCode);
    return NextResponse.json({
      success: true,
      status: result.analysisStatus || "IN_PROGRESS",
      started: result.started,
      already_processed: result.alreadyProcessed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start processing." },
      { status: 409 }
    );
  }
}
