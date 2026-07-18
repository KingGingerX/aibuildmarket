import crypto from "crypto";
import { prisma } from "./prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function createVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.deleteMany({ where: { userId } });
  await prisma.verificationToken.create({
    data: { token, userId, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

export async function consumeVerificationToken(
  token: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return { ok: false, error: "Invalid or already-used verification link." };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false, error: "This verification link has expired. Request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return { ok: true, userId: record.userId };
}
