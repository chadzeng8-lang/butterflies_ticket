import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return new NextResponse("Not found", { status: 404 });
  }
  const full = path.join(getUploadsDir(), name);
  if (!fs.existsSync(full)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = fs.readFileSync(full);
  const ext = path.extname(name).toLowerCase();
  const type =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
