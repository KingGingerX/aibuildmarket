import type { ReactElement } from "react";

type IconProps = { className?: string };

const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function WrenchIcon(props: IconProps) {
  return (
    <svg {...base} className={props.className} aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18l3 3 6.1-6.1a4 4 0 0 0 5.6-5.6l-2.5 2.5-2-2 2.5-2.5Z" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...base} className={props.className} aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </svg>
  );
}

export function BulbIcon(props: IconProps) {
  return (
    <svg {...base} className={props.className} aria-hidden="true">
      <path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.7.6 1 1.4 1 2.3V16h6v-1.2c0-.9.3-1.7 1-2.3A6 6 0 0 0 12 2Z" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...base} className={props.className} aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export function GameIcon(props: IconProps) {
  return (
    <svg {...base} className={props.className} aria-hidden="true">
      <rect x="2" y="8" width="20" height="10" rx="5" />
      <path d="M7 11v4M5 13h4M15.5 12.5h.01M18 14.5h.01" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base} className={props.className} aria-hidden="true">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export const CATEGORY_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  AI_TOOLS: WrenchIcon,
  BUSINESSES: BuildingIcon,
  IDEAS_IP: BulbIcon,
  PROMPTS: DocumentIcon,
  GAMES: GameIcon,
};
