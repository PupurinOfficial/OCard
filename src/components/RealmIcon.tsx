import type { Realm } from '../game/types';

const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const radius = i % 2 === 0 ? 6.2 : 2.7;
  const angle = (Math.PI / 5) * i - Math.PI / 2;
  return `${(12 + radius * Math.cos(angle)).toFixed(2)},${(11 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

export function RealmIcon({ realm, size = 22 }: { realm: Realm; size?: number }) {
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
      aria-label={realm}
    >
      <circle cx="12" cy={realm === '人界' ? 10 : 11} r={realm === '人界' ? 8.2 : 8.8} />
      {realm === '天堂' ? (
        <>
          <line x1="12" y1="4.5" x2="12" y2="17.5" />
          <line x1="5.5" y1="11" x2="18.5" y2="11" />
        </>
      ) : null}
      {realm === '地狱' ? <polygon points={STAR_POINTS} /> : null}
      {realm === '人界' ? (
        <>
          <line x1="12" y1="18.2" x2="8" y2="22.2" />
          <line x1="12" y1="18.2" x2="16" y2="22.2" />
        </>
      ) : null}
    </svg>
  );
}
