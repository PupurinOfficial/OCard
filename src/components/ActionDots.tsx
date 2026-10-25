import { MAX_ACTION } from '../game/engine';

export function ActionDots({ value }: { value: number }) {
  return (
    <div className="action-dots" aria-label={`行动值 ${value} / ${MAX_ACTION}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        {Array.from({ length: MAX_ACTION }, (_, index) => {
          const t = MAX_ACTION > 1 ? index / (MAX_ACTION - 1) : 0;
          const angle = (Math.PI / 2) * t;
          const cx = 60 + 44 * Math.cos(angle);
          const cy = 60 + 44 * Math.sin(angle);
          const active = index < value;
          return <circle key={index} cx={cx} cy={cy} r={5.2} className={active ? 'dot--on' : 'dot--off'} />;
        })}
        <path className="dot-bolt" d="M63 44 L52 63 L58 63 L55 78 L70 58 L62 58 Z" />
      </svg>
      <span className="action-dots-label">行动值</span>
    </div>
  );
}
