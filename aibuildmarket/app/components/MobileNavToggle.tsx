"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MobileNavToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="hamburger"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`nav-collapse${open ? " open" : ""}`}>{children}</div>
    </>
  );
}
