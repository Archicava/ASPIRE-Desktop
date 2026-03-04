import { formatProbability } from '../lib/format';
import { InferenceCategory } from '../types';

type ProbabilityBarsProps = {
  categories: InferenceCategory[];
};

export function ProbabilityBars({ categories }: ProbabilityBarsProps) {
  return (
    <div className="probability-stack">
      {categories.map((category) => (
        <div key={category.label} className="probability-row">
          <div className="probability-header">
            <span>{category.label}</span>
            <strong>{formatProbability(category.probability)}</strong>
          </div>
          <div className="probability-track">
            <div
              className="probability-fill"
              style={{ width: `${Math.round(category.probability * 100)}%` }}
            />
          </div>
          {category.narrative ? (
            <p className="probability-note">{category.narrative}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
