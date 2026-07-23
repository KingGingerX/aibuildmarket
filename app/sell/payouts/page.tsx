import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { CheckIcon } from "@/app/components/Icon";
import PayoutsConnectButton from "./PayoutsConnectButton";

export default async function PayoutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  let chargesEnabled = false;
  let detailsSubmitted = false;
  if (user.stripeConnectId) {
    const account = await getStripe().accounts.retrieve(user.stripeConnectId);
    chargesEnabled = Boolean(account.charges_enabled);
    detailsSubmitted = Boolean(account.details_submitted);
  }

  return (
    <main className="page-shell">
      <h1>Seller Payouts</h1>
      <p className="dim">Connect a Stripe account so buyers can pay you directly. AI Build Market takes its 5% fee at checkout — the rest lands in your Stripe balance.</p>

      <div className="status-card">
        {chargesEnabled ? (
          <>
            <div className="status-badge status-ok"><CheckIcon /> Payouts active</div>
            <p className="dim">Your Stripe account is ready to receive payments. New sales will route straight to you.</p>
          </>
        ) : detailsSubmitted ? (
          <>
            <div className="status-badge status-pending">Pending Stripe review</div>
            <p className="dim">Stripe is verifying your details. This usually clears within a few minutes to a day.</p>
          </>
        ) : user.stripeConnectId ? (
          <>
            <div className="status-badge status-pending">Setup incomplete</div>
            <p className="dim">You started onboarding but didn't finish. Continue where you left off.</p>
            <PayoutsConnectButton label="Continue Setup" />
          </>
        ) : (
          <>
            <div className="status-badge status-off">Not connected</div>
            <p className="dim">You need a connected Stripe account before any listing of yours can be bought directly.</p>
            <PayoutsConnectButton label="Connect Stripe" />
          </>
        )}
      </div>
    </main>
  );
}
