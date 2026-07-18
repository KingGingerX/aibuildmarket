import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCommentSchema = z.object({
  listingId: z.string(),
  body: z.string().min(1).max(2000),
  authorFontId: z.string().nullish(),
});

// GET /api/comments?listingId=xxx — requires a logged-in session.
// Logged-out requests get a 401 with zero comment content, not a partial/blurred payload.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Log in to view comments." },
      { status: 401 }
    );
  }

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { listingId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { displayName: true } } },
  });

  const fontIds = [...new Set(comments.map((c) => c.authorFontId).filter((id): id is string => Boolean(id)))];
  const fontPacks = fontIds.length
    ? await prisma.cosmeticPack.findMany({ where: { id: { in: fontIds }, type: "FONT" } })
    : [];
  const fontById = new Map(fontPacks.map((f) => [f.id, f.payload]));

  return NextResponse.json({
    comments: comments.map((c) => ({
      ...c,
      authorFontFamily: c.authorFontId ? fontById.get(c.authorFontId) ?? null : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to comment." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);

  let authorFontId: string | null = null;
  if (parsed.data.authorFontId) {
    // Never trust the client's claim of ownership — re-check server-side.
    const owns =
      isAdmin ||
      (await prisma.cosmeticPurchase.findUnique({
        where: { userId_packId: { userId, packId: parsed.data.authorFontId } },
      }))?.status === "COMPLETED";
    if (owns) authorFontId = parsed.data.authorFontId;
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      listingId: parsed.data.listingId,
      authorId: userId,
      authorFontId,
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
