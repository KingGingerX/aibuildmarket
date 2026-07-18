import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Listings change constantly and the sitemap needs a live DB read, so this
// can't be statically prerendered at build time — generate it per-request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_URL || "https://aibuildmarket.com";

  const listings = await prisma.listing.findMany({
    where: { active: true },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/legal`, changeFrequency: "monthly", priority: 0.3 },
    ...listings.map((l) => ({
      url: `${base}/listings/${l.id}`,
      lastModified: l.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
