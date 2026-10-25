import type { CardType } from '../game/types';

export function TypeIcon({ type, size = 22 }: { type: CardType; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={type}
    >
      {type === '进攻牌' ? (
        <>
          <path d="M13 3.5 L19 5 L15.5 13 L11 9.5 Z" />
          <line x1="11.4" y1="9.6" x2="6.4" y2="14.6" />
          <line x1="6.2" y1="17.8" x2="4.2" y2="19.8" />
          <line x1="8.2" y1="15.8" x2="10" y2="13.6" />
        </>
      ) : null}
      {type === '防守牌' ? (
        <path d="M12 3.2 L20 6.2 V12 C20 17 16.2 20 12 21.6 C7.8 20 4 17 4 12 V6.2 Z" />
      ) : null}
      {type === '物品牌' ? (
        <>
          <circle cx="12" cy="5.6" r="2.8" />
          <circle cx="17.2" cy="9.4" r="2.8" />
          <circle cx="15.2" cy="15.5" r="2.8" />
          <circle cx="8.8" cy="15.5" r="2.8" />
          <circle cx="6.8" cy="9.4" r="2.8" />
          <circle cx="12" cy="11.4" r="1.6" />
        </>
      ) : null}
    </svg>
  );
}
