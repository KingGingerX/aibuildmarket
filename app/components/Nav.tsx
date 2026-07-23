import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";
import MobileNavToggle from "./MobileNavToggle";

const CATEGORIES: { label: string; value: string }[] = [
  { label: "AI Tools", value: "AI_TOOLS" },
  { label: "Businesses", value: "BUSINESSES" },
  { label: "Ideas & IP", value: "IDEAS_IP" },
  { label: "Prompts", value: "PROMPTS" },
  { label: "Games", value: "GAMES" },
];

export default async function Nav() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const name = session?.user?.name;
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | undefined)?.isAdmin);
  const userId = session?.user ? (session.user as { id: string }).id : undefined;
  const avatarUrl = userId
    ? (await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } }))?.avatarUrl
    : null;

  return (
    <nav className="site-nav">
      <Link href="/" className="logo">
        <Image src="/logo.jpg" alt="AI Build Market logo" width={30} height={30} />
        AI<span className="brand-accent">Build</span>Market<span className="brand-dim">.com</span>
      </Link>

      <MobileNavToggle>
        <div className="nav-links">
          {CATEGORIES.map((c) => (
            <Link key={c.value} href={`/?category=${c.value}`}>{c.label}</Link>
          ))}
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <Link href="/account" className="avatar-flair">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" width={26} height={26} unoptimized style={{ borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="avatar-dot" />
                )}
                <span className="flair-name mono">{name}</span>
              </Link>
              <Link href="/sell/listings" className="btn btn-ghost">My Listings</Link>
              <Link href="/store" className="btn btn-ghost">Store</Link>
              <Link href="/sell/payouts" className="btn btn-ghost">Payouts</Link>
              <Link href="/listings/new" className="btn btn-primary">Sell Something</Link>
              {isAdmin && <Link href="/admin" className="btn btn-ghost">Admin</Link>}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log In</Link>
              <Link href="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </MobileNavToggle>
    </nav>
  );
}
