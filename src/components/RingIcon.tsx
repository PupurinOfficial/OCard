export function RingIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 4 A8 8 0 0 1 19.2 9.2"
        stroke="#e8b84b"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
