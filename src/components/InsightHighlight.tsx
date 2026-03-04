const insights = [
  {
    metric: '26%',
    label: 'Minimally verbal subgroup',
    context: 'Language outcomes tracked from the Romanian ASD cohort.'
  },
  {
    metric: '2.1x',
    label: 'Higher EEG anomaly prevalence',
    context: 'Relative to pediatric baseline; informs neurology follow-up.'
  },
  {
    metric: '18 mo',
    label: 'Median diagnosis age signal',
    context: 'Early detection is strongly associated with better intervention outcomes.'
  }
];

export function InsightHighlight() {
  return (
    <section className="panel insight-panel">
      <header>
        <p className="eyebrow">Research-grounded analytics</p>
        <h2>Key signals from the source study</h2>
      </header>
      <div className="insight-grid">
        {insights.map((item) => (
          <article key={item.label} className="insight-card">
            <p className="insight-metric">{item.metric}</p>
            <p className="insight-label">{item.label}</p>
            <p className="insight-context">{item.context}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
