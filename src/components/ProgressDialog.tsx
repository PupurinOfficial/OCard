import { useEffect } from 'react';
import type { SaveData } from '../data/save';
import {
  DIFFICULTY_REDUCE_MIN_LEVEL,
  EFFECT_DOUBLING_FROM,
  REWARD_BASE,
  effectiveDifficulty,
  enemyEffectMultiplier,
  levelFromWins,
  winsForLevel,
} from '../game/progress';
import './progress-dialog.css';

interface Props {
  save: SaveData;
  onClose: () => void;
  onToggleDifficulty: () => void;
}

const LEVEL_STEPS = [1, 2, 3, 4, 5, 6, 7];

/** 等级与难度共用的一个弹窗 */
export function ProgressDialog({ save, onClose, onToggleDifficulty }: Props) {
  const level = levelFromWins(save.wins);
  const difficulty = effectiveDifficulty(level, save.difficultyReduced);
  const multiplier = enemyEffectMultiplier(difficulty);
  const nextThreshold = winsForLevel(level);
  const canReduce = level >= DIFFICULTY_REDUCE_MIN_LEVEL;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="progress-mask" onClick={onClose}>
      <div
        className="progress-card progress-card--wide"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="progress-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className="progress-columns">
          <section className="progress-block">
            <p className="progress-kicker">等级</p>
            <h2 className="progress-value">{level}</h2>
            <p className="progress-line">
              累计胜利 <b>{save.wins}</b> 局
            </p>
            <p className="progress-note">
              距 {level + 1} 级还需 {Math.max(0, nextThreshold - save.wins)} 胜
            </p>
            <div className="level-track">
              {LEVEL_STEPS.map((step) => {
                const reached = level >= step;
                return (
                  <div key={step} className={`level-step ${reached ? 'is-reached' : ''}`}>
                    <span>{step}</span>
                    <small>{step === 1 ? '初始' : `${winsForLevel(step - 1)} 胜`}</small>
                  </div>
                );
              })}
            </div>
            <p className="progress-foot">
              在累计胜利 1、2、4、8、16、32… 局时提升 1 级。对战难度默认与等级相同。
            </p>
          </section>

          <section className="progress-block progress-block--difficulty">
            <p className="progress-kicker">对战难度</p>
            <h2 className="progress-value">{difficulty}</h2>
            <p className="progress-line">
              默认与等级相同
              {save.difficultyReduced && canReduce ? ' · 已主动降低 1 级' : ''}
            </p>
            <div className="progress-rows">
              <div>
                <span>敌方卡牌数</span>
                <b>
                  {difficulty <= 2 ? difficulty + 2 : difficulty === 3 ? 6 : '7–10 张随机'}
                </b>
              </div>
              <div>
                <span>敌方卡牌效果</span>
                <b>{multiplier > 1 ? `×${multiplier}` : '无加成'}</b>
              </div>
              <div>
                <span>胜利奖励</span>
                <b>
                  ({REWARD_BASE} − 失去卡牌数) × {difficulty} ÷ 2
                </b>
              </div>
            </div>
            {multiplier > 1 ? (
              <p className="progress-note">
                难度 {EFFECT_DOUBLING_FROM} 起，每提升 1 级敌方卡牌效果翻倍。
              </p>
            ) : null}
            <div className="progress-action">
              <button type="button" className="btn" onClick={onToggleDifficulty} disabled={!canReduce}>
                {save.difficultyReduced ? '恢复难度' : '降低难度'}
              </button>
              <span className="progress-hint">
                {canReduce
                  ? '降低后难度为等级 − 1，可随时恢复'
                  : `等级达到 ${DIFFICULTY_REDUCE_MIN_LEVEL} 后可降低 1 级`}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
