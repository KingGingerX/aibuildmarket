import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mailer";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  displayName: z.string().min(2).max(40),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { allowed, retryAfterSeconds } = rateLimit(`signup:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName,
    },
  });

  let emailSent = true;
  try {
    const token = await createVerificationToken(user.id);
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    emailSent = false;
    console.error("[signup] verification email not sent:", (err as Error).message);
  }

  return NextResponse.json(
    {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      emailSent,
      message: emailSent
        ? "Check your email to verify your account before listing a build."
        : "Account created, but the verification email could not be sent — email isn't configured on this deployment yet. You can still log in and browse.",
    },
    { status: 201 }
  );
}
