import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvatarUploader from "./AvatarUploader";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  return (
    <main className="page-shell" style={{ maxWidth: 560 }}>
      <h1>Account Settings</h1>
      <p className="dim">Manage your profile, picture, and password.</p>

      <section style={{ marginTop: 28 }}>
        <h2>Profile Picture</h2>
        <AvatarUploader avatarUrl={user.avatarUrl} displayName={user.displayName} />
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Display Name</h2>
        <ProfileForm displayName={user.displayName} />
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Email</h2>
        <p className="dim" style={{ fontSize: 13.5 }}>{user.email}{user.emailVerified ? " — verified" : " — not verified"}</p>
      </section>

      <section style={{ marginTop: 28, marginBottom: 40 }}>
        <h2>Change Password</h2>
        <PasswordForm />
      </section>
    </main>
  );
}
