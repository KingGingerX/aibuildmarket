import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// POST /api/account/avatar — multipart form upload, field name "file".
// Stores the image in Vercel Blob and points User.avatarUrl at it.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage isn't configured on this deployment yet. Enable Vercel Blob for this project (Storage tab in the Vercel dashboard) and redeploy." },
      { status: 503 }
    );
  }

  const { allowed, retryAfterSeconds } = rateLimit(`avatar-upload:${clientIp(req)}:${userId}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: blob.url },
  });

  return NextResponse.json({ avatarUrl: user.avatarUrl });
}
