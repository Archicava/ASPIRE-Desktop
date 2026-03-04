import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { InsightHighlight } from '../components/InsightHighlight';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../lib/format';
import { loadCaseRecords, loadPlatformStatus } from '../lib/remote-data';
import { CaseRecord, InferenceJob } from '../types';

function getMedian(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function WorkspacePage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [jobs, setJobs] = useState<InferenceJob[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [platformStatus, setPlatformStatus] = useState<{
    cstore?: Record<string, unknown>;
    r1fs?: Record<string, unknown>;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      setLoading(true);
      setSyncError(null);

      try {
        const [nextCases, nextStatus] = await Promise.all([
          loadCaseRecords(),
          loadPlatformStatus()
        ]);

        if (!mounted) {
          return;
        }

        const nextJobs: InferenceJob[] = nextCases.slice(0, 8).map((record) => ({
          id: record.jobId ?? `JOB-${record.id}`,
          caseId: record.id,
          status: record.inference?.prediction ? 'succeeded' : 'queued',
          submittedAt: record.submittedAt,
          statusHistory: [
            {
              status: record.inference?.prediction ? 'succeeded' : 'queued',
              timestamp: record.submittedAt
            }
          ]
        }));

        setCases(nextCases);
        setJobs(nextJobs);
        setPlatformStatus(nextStatus);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setSyncError(error instanceof Error ? error.message : 'Failed to load workspace data.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      mounted = false;
    };
  }, []);

  const activeCases = cases.length;
  const eegPositiveRate = activeCases
    ? Math.round(
        (cases.filter((item) => item.assessments.eegAnomalies).length / activeCases) *
          100
      )
    : 0;
  const medianDiagnosticAge = getMedian(
    cases.map((item) => item.demographics.diagnosticAgeMonths)
  );
  const minimallyVerbal = activeCases
    ? Math.round(
        (cases.filter((item) => item.behaviors.languageLevel === 'Absent').length /
          activeCases) *
          100
      )
    : 0;

  const cstoreMode = useMemo(() => {
    if (!platformStatus.cstore) {
      return 'unknown';
    }
    const mode = platformStatus.cstore.mode;
    return typeof mode === 'string' ? mode : 'online';
  }, [platformStatus.cstore]);

  const r1fsMode = useMemo(() => {
    if (!platformStatus.r1fs) {
      return 'unknown';
    }
    const mode = platformStatus.r1fs.mode;
    return typeof mode === 'string' ? mode : 'online';
  }, [platformStatus.r1fs]);

  return (
    <div className="page-flow">
      <section className="panel hero-panel">
        <p className="eyebrow">ASPIRE Desktop</p>
        <h1>Workspace</h1>
        <p>
          Desktop adaptation of the ASPIRE platform for cohort monitoring,
          case exploration, and predictive scenario testing.
        </p>
        <p className="sync-note">
          CStore: {cstoreMode} • R1FS: {r1fsMode}
        </p>
        {syncError ? <p className="form-error">{syncError}</p> : null}
      </section>

      <section className="stat-grid">
        <StatCard
          label="Active cohort cases"
          value={activeCases}
          caption={loading ? 'Refreshing from web API...' : 'Synced from /api/cases'}
          accent="blue"
        />
        <StatCard
          label="EEG anomaly prevalence"
          value={`${eegPositiveRate}%`}
          caption="Derived from case assessment flags"
          accent="amber"
        />
        <StatCard
          label="Median diagnostic age"
          value={`${medianDiagnosticAge} months`}
          caption="Median across imported case records"
          accent="green"
        />
        <StatCard
          label="Minimally verbal cohort"
          value={`${minimallyVerbal}%`}
          caption="Language level marked as Absent"
          accent="red"
        />
      </section>

      <section className="panel">
        <header>
          <p className="eyebrow">Protocol overview</p>
          <h2>End-to-end flow</h2>
        </header>
        <ol className="protocol-list">
          <li>Capture structured case data across demographics and assessments.</li>
          <li>Run predictive scenario analysis from cohort-informed factors.</li>
          <li>Track inference status snapshots and store audit-safe metadata.</li>
          <li>Review recommendations with phenotype-specific guidance.</li>
        </ol>
      </section>

      <InsightHighlight />

      <section className="panel">
        <header className="split-header">
          <div>
            <p className="eyebrow">Job monitor</p>
            <h2>Recent inference jobs</h2>
          </div>
        </header>
        <div className="table-wrap">
          <table className="job-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Case</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.caseId}</td>
                  <td>
                    <span className={`status-pill status-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{formatDateTime(job.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <header className="split-header">
          <div>
            <p className="eyebrow">Case stream</p>
            <h2>Recent submissions</h2>
          </div>
          <Link to="/cases" className="text-link">
            Open Case Library →
          </Link>
        </header>
        <div className="card-stack compact">
          {cases.slice(0, 6).map((record) => (
            <article className="case-card" key={record.id}>
              <div>
                <p className="case-title">{record.demographics.caseLabel}</p>
                <p className="case-meta">
                  {record.id} • {record.demographics.ageMonths} months •{' '}
                  {record.demographics.sex}
                </p>
              </div>
              <Link to={`/cases/${record.id}`} className="text-link">
                View details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
