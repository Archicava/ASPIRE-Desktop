import { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number;
  caption?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red';
  icon?: ReactNode;
};

const accentByTone = {
  blue: {
    color: '#1848a6',
    bg: 'linear-gradient(145deg, #edf4ff, #d9e7ff)'
  },
  green: {
    color: '#176243',
    bg: 'linear-gradient(145deg, #ecfbf4, #d2f5e5)'
  },
  amber: {
    color: '#845409',
    bg: 'linear-gradient(145deg, #fff6e6, #ffe8be)'
  },
  red: {
    color: '#9a2e2e',
    bg: 'linear-gradient(145deg, #ffeef0, #ffd8de)'
  }
};

export function StatCard({
  label,
  value,
  caption,
  accent = 'blue',
  icon
}: StatCardProps) {
  const tone = accentByTone[accent];

  return (
    <article className="stat-card" style={{ background: tone.bg }}>
      <div className="stat-title-row">
        <p className="stat-label">{label}</p>
        {icon ? <span className="stat-icon">{icon}</span> : null}
      </div>
      <p className="stat-value" style={{ color: tone.color }}>
        {value}
      </p>
      {caption ? <p className="stat-caption">{caption}</p> : null}
    </article>
  );
}
