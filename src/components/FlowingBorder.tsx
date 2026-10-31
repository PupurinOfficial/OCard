import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './flow-border.css';

/** 一条沿边缘流动的“水线” */
export interface FlowLine {
  /** 线段长度（占周长的百分比） */
  length: number;
  /** 绕行一圈的秒数 */
  duration: number;
  /** 起始相位（秒，负值表示从半途开始） */
  delay: number;
  /** 逆时针流动（false 为顺时针） */
  reverse: boolean;
  opacity: number;
  /** 线宽（px） */
  width: number;
}

/** 生成一组随机水线：长度、速度、相位、亮度、粗细各不相同；方向统一为逆时针 */
export function makeFlowLines(count: number, random: () => number = Math.random): FlowLine[] {
  return Array.from({ length: count }, () => ({
    length: 7 + random() * 16,
    duration: 3.4 + random() * 5.2,
    delay: -(random() * 5.2),
    // SVG 圆角矩形路径按顺时针描边，取反向动画即为逆时针流动
    reverse: true,
    opacity: 0.55 + random() * 0.45,
    width: 1.5 + random() * 1.6,
  }));
}

interface FlowingBorderProps {
  lines: FlowLine[];
  className?: string;
  /** 水线与组件边缘的距离（px） */
  inset?: number;
  /** 圆角半径（px），超过尺寸一半时自动收成胶囊 */
  radius?: number;
  color?: string;
}

/**
 * 沿组件原有描边轨迹流动的几条水线。
 * 用真实像素坐标绘制，因此圆角、胶囊按钮都不会被拉伸变形。
 */
export function FlowingBorder({
  lines,
  className = '',
  inset = 0,
  radius = 24,
  color = 'var(--gold)',
}: FlowingBorderProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setBox((prev) =>
        prev && Math.abs(prev.w - rect.width) < 0.5 && Math.abs(prev.h - rect.height) < 0.5
          ? prev
          : { w: rect.width, h: rect.height },
      );
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const corner = box
    ? Math.max(0, Math.min(radius, box.w / 2 - inset, box.h / 2 - inset))
    : Math.max(0, radius);

  return (
    <svg
      ref={svgRef}
      className={`flow-border ${className}`.trim()}
      style={{ '--flow-color': color } as CSSProperties}
      aria-hidden="true"
    >
      {box
        ? lines.map((line, index) => (
            <rect
              key={index}
              x={inset}
              y={inset}
              width={Math.max(0, box.w - inset * 2)}
              height={Math.max(0, box.h - inset * 2)}
              rx={corner}
              ry={corner}
              pathLength={100}
              className={line.reverse ? 'is-reverse' : undefined}
              style={{
                strokeDasharray: `${line.length} ${100 - line.length}`,
                animationDuration: `${line.duration}s`,
                animationDelay: `${line.delay}s`,
                opacity: line.opacity,
                strokeWidth: line.width,
              }}
            />
          ))
        : null}
    </svg>
  );
}
