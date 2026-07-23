// One-off: force-reset the admin account's password.
// Run: node scripts/reset-admin-password.js <newPassword>
// Needs DATABASE_URL pointed at the target (e.g. production) DB in env.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "kinggingerxxx@gmail.com";

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword || newPassword.length < 8) {
    console.error("Usage: node scripts/reset-admin-password.js <newPassword (8+ chars)>");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!user) {
    console.error(`No account found for ${ADMIN_EMAIL}`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, isAdmin: true },
  });

  console.log(`Password reset for ${ADMIN_EMAIL}. isAdmin=true. Log in at /login with the new password.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
