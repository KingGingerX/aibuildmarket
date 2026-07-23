import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route. Delete this file after use.
const RESET_TOKEN = "b5239ba2adb6229f254176f1952c257e0fdbd7096aa7c8da";
const ADMIN_EMAIL = "kinggingerxxx@gmail.com";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-reset-token");
  if (token !== RESET_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { password } = await req.json();
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "password must be 8+ chars" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, isAdmin: true },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      displayName: "Goody",
      isAdmin: true,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true, email: user.email, isAdmin: user.isAdmin });
}
