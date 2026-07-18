import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="legal-wrap">
        <div className="legal-grid">
          <div>
            <h6>AI Build Market</h6>
            <p className="dim" style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
              A marketplace for AI-built tools, businesses, ideas, prompts, and games. We connect builders to buyers — the deal itself is between the two of you.
            </p>
          </div>
          <div>
            <h6>MARKETPLACE</h6>
            <ul>
              <li><Link href="/">Browse Listings</Link></li>
              <li><Link href="/listings/new">Sell a Build</Link></li>
              <li><Link href="/search">Search</Link></li>
            </ul>
          </div>
          <div>
            <h6>LEGAL</h6>
            <ul>
              <li><Link href="/legal">Terms Summary</Link></li>
              <li><Link href="/legal#privacy">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal-strip">
          <b>How every sale works:</b> AI Build Market is a venue, not a party to the transaction. Every sale is a direct agreement between buyer and seller. AI Build Market provides the platform, payment processing, and buyer traffic, and takes a transaction fee for that — it does not build, own, warrant, or guarantee any listed tool, business, idea, prompt, or game. All listings are sold <b>as-is, where-is</b> unless a seller explicitly states an additional guarantee in writing on the listing itself.
        </div>
        <div className="legal-strip" style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
          © {new Date().getFullYear()} AI Build Market is owned and operated by TGB Global Systems LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
