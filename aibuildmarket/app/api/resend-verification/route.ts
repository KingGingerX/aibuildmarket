import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { allowed, retryAfterSeconds } = rateLimit(`resend-verify:${userId}`, {
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Email already verified." }, { status: 400 });
  }

  try {
    const token = await createVerificationToken(user.id);
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 503 }
    );
  }

  return NextResponse.json({ sent: true });
}
