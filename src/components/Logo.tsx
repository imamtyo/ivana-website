export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0f766e" />
      <path d="M14 47 25 15l8 21 8-15 10 26" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 47h34" stroke="white" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
