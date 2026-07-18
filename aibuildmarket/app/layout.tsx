import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: "AI Build Market — Buy & Sell AI Tools, AI Businesses, Prompts & Games",
  description:
    "AI Build Market is the marketplace to buy and sell AI-built tools, AI businesses, prompts, ideas, and games. Listing is free; the platform takes a transaction fee only on completed sales.",
  keywords: [
    "buy AI tools",
    "sell AI tools",
    "AI business marketplace",
    "sell AI business",
    "AI prompt marketplace",
    "buy AI prompts",
    "sell AI startup",
    "AI tool marketplace",
    "micro SaaS marketplace",
    "buy AI apps",
  ],
  icons: { icon: "/logo.jpg" },
  openGraph: {
    type: "website",
    siteName: "AI Build Market",
    title: "AI Build Market — Buy & Sell AI Tools and AI Businesses",
    description: "The marketplace for AI-built tools, businesses, prompts, ideas, and games. Real buyers, real sellers, one transaction fee.",
    images: ["/logo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Build Market — Buy & Sell AI Tools and AI Businesses",
    description: "Marketplace for AI-built tools, businesses, prompts, ideas, and games.",
    images: ["/logo.jpg"],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AI Build Market",
    url: process.env.NEXT_PUBLIC_URL,
    description: "A marketplace where builders sell AI-developed tools, businesses, prompts, ideas, and games directly to buyers.",
    slogan: "Sell what your AI built. Buy what works.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Build Market",
    url: process.env.NEXT_PUBLIC_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.NEXT_PUBLIC_URL}/search?q={search_term}`,
      "query-input": "required name=search_term",
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Mono:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Pacifico&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {jsonLd.map((entry, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
      </head>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
