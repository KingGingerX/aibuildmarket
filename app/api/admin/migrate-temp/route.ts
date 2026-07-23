import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// TEMPORARY one-off route. Delete this file after use.
// Applies prisma/migrations/20260723080000_account_and_listing_management by
// hand (DATABASE_URL is a sensitive Vercel env var and can't be pulled to run
// `prisma migrate deploy` locally), then records it in _prisma_migrations so
// a future real `prisma migrate deploy` treats it as already applied.
const MIGRATE_TOKEN = "e342831ed1f97281ee43ff479b6ada49da006dda4da86056";
const MIGRATION_NAME = "20260723080000_account_and_listing_management";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-migrate-token");
  if (token !== MIGRATE_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const already = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
    `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = $1`,
    MIGRATION_NAME
  );
  if (already.length > 0) {
    return NextResponse.json({ ok: true, alreadyApplied: true });
  }

  const sqlPath = path.join(process.cwd(), "prisma", "migrations", MIGRATION_NAME, "migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const checksum = crypto.createHash("sha256").update(sql).digest("hex");

  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const startedAt = new Date();
  try {
    await prisma.$transaction(
      statements.map((stmt) => prisma.$executeRawUnsafe(stmt))
    );
  } catch (err) {
    return NextResponse.json(
      { error: "migration failed", detail: (err as Error).message },
      { status: 500 }
    );
  }

  const migrationId = crypto.randomBytes(16).toString("hex");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES ($1, $2, now(), $3, NULL, NULL, $4, 1)`,
    migrationId,
    checksum,
    MIGRATION_NAME,
    startedAt
  );

  return NextResponse.json({ ok: true, statementsRun: statements.length });
}
