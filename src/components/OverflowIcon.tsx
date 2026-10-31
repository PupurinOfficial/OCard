/** 「满溢之辉」图标：光辉溢出的四芒星 */
export function OverflowIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.4 L13.7 9.1 L20.4 10.8 L13.7 12.5 L12 19.2 L10.3 12.5 L3.6 10.8 L10.3 9.1 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.2 L12.9 10.3 L16 11.2 L12.9 12.1 L12 15.2 L11.1 12.1 L8 11.2 L11.1 10.3 Z"
        fill="#e8b84b"
      />
    </svg>
  );
}
