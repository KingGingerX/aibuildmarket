"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function PageWatermark() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="page-watermark" aria-hidden="true">
      <Image src="/logo.jpg" alt="" fill sizes="620px" priority={false} />
    </div>
  );
}
