import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mailer";

const schema = z.object({ email: z.string().email() });

// POST /api/forgot-password { email }
// Always returns the same generic message whether or not the account exists,
// so this can't be used to enumerate registered emails.
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { allowed, retryAfterSeconds } = rateLimit(`forgot-password:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const genericMessage = "If an account exists for that email, a reset link is on its way.";

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ message: genericMessage });
  }

  try {
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, token);
  } catch (err) {
    console.error("[forgot-password] email not sent:", (err as Error).message);
    return NextResponse.json(
      { error: "Email isn't configured on this deployment yet — the reset link couldn't be sent." },
      { status: 503 }
    );
  }

  return NextResponse.json({ message: genericMessage });
}
