export const metadata = { title: "Terms Summary — AI Build Market" };

export default function LegalPage() {
  return (
    <main className="page-shell">
      <h1>Terms Summary</h1>
      <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
        <b style={{ color: "var(--text)" }}>Not legal advice.</b> This is a structural outline of the clauses a marketplace like this typically needs — have an attorney draft the binding Terms of Service / Seller Agreement before real-money launch, especially the arbitration and tax sections, which are jurisdiction-specific.
      </p>

      <h2>1. Marketplace Facilitator, Not Seller</h2>
      <p>AI Build Market is a venue connecting independent buyers and sellers. Title to any tool, code, business entity, prompt, or game transfers directly from seller to buyer. AI Build Market never takes ownership of listed goods and disclaims any role as manufacturer, developer, or warrantor of what's sold.</p>

      <h2>2. Limitation of Liability</h2>
      <p>Once a transaction completes, AI Build Market's liability ends. No responsibility for bugs, downtime, revenue claims, business viability, IP validity, or consequential/incidental damages. Liability is capped at fees actually collected on that transaction.</p>

      <h2>3. As-Is / No Warranty</h2>
      <p>All goods are sold as-is. Any performance claims, revenue numbers, or guarantees come from the seller, not AI Build Market, and are the seller's sole representation and liability.</p>

      <h2>4. IP Ownership &amp; AI-Generated Content Disclosure</h2>
      <p>Sellers must warrant they have the right to sell what they're listing, and must disclose when a listing was AI-generated or AI-assisted. AI-generated output has unsettled copyright status in the U.S. — buyers may be purchasing something with limited or no copyright protection, and evaluating that risk is on them before buying.</p>

      <h2>5. Dispute Resolution</h2>
      <p>Mandatory good-faith negotiation window, then binding individual arbitration, with a class action waiver.</p>

      <h2>6. Escrow / Payment Handling</h2>
      <p id="privacy">Funds route through Stripe Connect and are released to the seller (minus the platform fee) as soon as the buyer's payment settles. Buyer and seller emails, names, and transaction records are used only to operate the marketplace — to facilitate the sale, send receipts, and resolve disputes — and are never sold to third parties.</p>

      <h2>7. Marketplace Facilitator Tax Laws</h2>
      <p>Most U.S. states require the marketplace, not the seller, to collect and remit sales tax above certain thresholds. A tax engine (e.g. Stripe Tax) should be wired in before real volume.</p>

      <h2>8. Prohibited Listings</h2>
      <p>No stolen code or IP, no malware or exploit tools, no unlicensed financial products or trading signals sold as guaranteed returns, no adult content, and nothing requiring a license the seller doesn't hold.</p>

      <h2>9. KYC on High-Value Listings</h2>
      <p>Anything sold as a "business" above a set dollar threshold should require identity verification on both sides to reduce fraud and chargeback risk.</p>
    </main>
  );
}
