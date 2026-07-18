// One-off: promote/create the admin account and print its login.
// Run: node scripts/seed-admin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "kinggingerxxx@gmail.com";

function genPassword() {
  return crypto.randomBytes(12).toString("base64url"); // 16 chars, url-safe
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    if (existing.isAdmin) {
      console.log(`Already admin: ${ADMIN_EMAIL} (id ${existing.id}) — no password change, use your existing login.`);
      return;
    }
    await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
    console.log(`Promoted existing account to admin: ${ADMIN_EMAIL} — use your existing password.`);
    return;
  }

  const password = genPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      displayName: "Goody",
      isAdmin: true,
      emailVerified: new Date(),
    },
  });

  console.log("=== ADMIN ACCOUNT CREATED ===");
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${password}`);
  console.log("Log in at /login. Change the password after first login if you want a memorable one.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
