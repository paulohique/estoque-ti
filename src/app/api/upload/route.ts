import { NextResponse } from "next/server";

import { uploadController } from "../../../controllers/uploadController";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await uploadController({
    itemId: body.itemId,
    fileName: body.fileName,
    filePath: body.filePath,
  });

  return NextResponse.json(result, { status: 201 });
}
