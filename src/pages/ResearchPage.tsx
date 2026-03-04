import { InsightHighlight } from '../components/InsightHighlight';
import { getCohortStats } from '../lib/data';

const researchChapters = [
  {
    title: 'Prenatal and perinatal factors',
    takeaways: [
      'Complication-linked pregnancies were stronger signals than IVF status alone after confound adjustments.',
      'Twin gestations correlated with increased neonatal complications and follow-up complexity.',
      'Maternal age above 35 appeared as a recurring feature in higher-risk clusters.'
    ]
  },
  {
    title: 'Developmental trajectories',
    takeaways: [
      'Early regression appears in a meaningful subset and helps separate profound ASD from broader delays.',
      'Language outcomes cluster into functional, delayed, and absent groups with distinct support needs.',
      'Motor-planning deficits appear more often in later-diagnosed profiles.'
    ]
  },
  {
    title: 'Neurobiology and comorbidities',
    takeaways: [
      'EEG anomalies occur at elevated rates compared to non-ASD pediatric groups.',
      'Syndromic presentations combine dysmorphic markers with structural MRI findings.',
      'Common comorbidities include GI, feeding, and cardiometabolic concerns.'
    ]
  }
];

const roadmap = [
  {
    phase: 'Q3 2026',
    focus: 'Longitudinal intervention outcomes',
    detail:
      'Track post-intervention language and adaptive gains to model response by phenotype.'
  },
  {
    phase: 'Q4 2026',
    focus: 'Biomarker enrichment',
    detail:
      'Layer blood, immune, and microbiome features into the cohort feature space.'
  },
  {
    phase: '2027',
    focus: 'Recommendation engine expansion',
    detail:
      'Match similar profiles to intervention plans with measured outcomes across institutions.'
  }
];

export function ResearchPage() {
  const stats = getCohortStats();

  return (
    <div className="page-flow">
      <section className="panel hero-panel">
        <p className="eyebrow">Research</p>
        <h1>Cohort insights and product alignment</h1>
        <p>
          Product decisions in this desktop version are mapped to the same
          research-led assumptions used by the ASPIRE web platform.
        </p>
      </section>

      <section className="panel">
        <header>
          <p className="eyebrow">Cohort KPIs</p>
          <h2>Dataset snapshot</h2>
        </header>
        <div className="metric-grid">
          <MetricCard
            label="Cases"
            value={`${stats.totalCases}`}
            description="Imported seed records"
          />
          <MetricCard
            label="Gender split"
            value={`${stats.gender.male}M / ${stats.gender.female}F`}
            description="Male:female distribution"
          />
          <MetricCard
            label="Diagnosis age (median)"
            value={`${stats.diagnosisAge.median ?? '-'} months`}
            description="Primary early-diagnosis benchmark"
          />
          <MetricCard
            label="Minimally verbal"
            value={`${Math.round((stats.language.absent / stats.totalCases) * 100)}%`}
            description="Language level marked as absent"
          />
          <MetricCard
            label="EEG anomalies"
            value={`${stats.eegAnomalyRate}%`}
            description="Non-normal EEG statuses"
          />
          <MetricCard
            label="MRI anomalies"
            value={`${stats.mriAnomalyRate}%`}
            description="Anomaly-labelled MRI statuses"
          />
        </div>
      </section>

      <InsightHighlight />

      {researchChapters.map((chapter) => (
        <section className="panel" key={chapter.title}>
          <header>
            <p className="eyebrow">Focus area</p>
            <h2>{chapter.title}</h2>
          </header>
          <ul className="plain-list">
            {chapter.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="panel">
        <header>
          <p className="eyebrow">Roadmap</p>
          <h2>Program extension</h2>
        </header>
        <div className="roadmap-grid">
          {roadmap.map((item) => (
            <article key={item.phase} className="roadmap-card">
              <p className="roadmap-phase">{item.phase}</p>
              <h3>{item.focus}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="mini-panel">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p>{description}</p>
    </article>
  );
}
