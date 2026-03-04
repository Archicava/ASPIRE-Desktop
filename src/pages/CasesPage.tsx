import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../components/AuthContext';
import { loadCaseRecords, removeCaseRecord } from '../lib/remote-data';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../lib/format';
import { CaseRecord } from '../types';

type RiskFilter = 'all' | 'low' | 'medium' | 'high';

function resolvePrediction(record: CaseRecord): string {
  return record.inference.prediction ?? record.inference.topPrediction ?? 'Pending';
}

function resolveRisk(record: CaseRecord): 'low' | 'medium' | 'high' | 'unknown' {
  return record.inference.riskLevel ?? 'unknown';
}

export function CasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let mounted = true;

    async function fetchCases() {
      setLoading(true);
      setError(null);
      try {
        const nextCases = await loadCaseRecords();
        if (mounted) {
          setCases(nextCases);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load cases.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchCases();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const asd = cases.filter((record) => resolvePrediction(record) === 'ASD').length;
    const healthy = cases.filter((record) => resolvePrediction(record) === 'Healthy').length;
    const highRisk = cases.filter((record) => resolveRisk(record) === 'high').length;

    return {
      total: cases.length,
      asd,
      healthy,
      highRisk
    };
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((record) => {
      const labelMatch = `${record.id} ${record.demographics.caseLabel}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const risk = resolveRisk(record);
      const riskMatch = riskFilter === 'all' ? true : risk === riskFilter;
      return labelMatch && riskMatch;
    });
  }, [cases, search, riskFilter]);

  const handleRemoveCase = async (caseId: string) => {
    if (!isAdmin) {
      return;
    }
    if (!window.confirm(`Remove case ${caseId}?`)) {
      return;
    }

    setActionError(null);
    const result = await removeCaseRecord(caseId);
    if (!result.success) {
      setActionError(result.error ?? 'Failed to remove case.');
      return;
    }

    setCases((previous) => previous.filter((record) => record.id !== caseId));
  };

  return (
    <div className="page-flow">
      <section className="panel hero-panel">
        <p className="eyebrow">Case Library</p>
        <h1>Cohort records</h1>
        <p>
          Explore imported ASPIRE case data, review outcome signals, and open
          detailed clinical profile views.
        </p>
        {loading ? <p className="sync-note">Refreshing case data from web API...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {actionError ? <p className="form-error">{actionError}</p> : null}
      </section>

      <section className="stat-grid">
        <StatCard label="Total cases" value={stats.total} accent="blue" />
        <StatCard label="ASD detected" value={stats.asd} accent="red" />
        <StatCard label="Healthy" value={stats.healthy} accent="green" />
        <StatCard label="High risk" value={stats.highRisk} accent="amber" />
      </section>

      <section className="panel">
        <header className="split-header">
          <div>
            <p className="eyebrow">Search and filter</p>
            <h2>Find cohort cases</h2>
          </div>
        </header>
        <div className="filter-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input"
            placeholder="Search by case id or label"
          />
          <select
            className="input"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
          >
            <option value="all">All risk levels</option>
            <option value="high">High risk</option>
            <option value="medium">Medium risk</option>
            <option value="low">Low risk</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <header className="split-header">
          <div>
            <p className="eyebrow">Results</p>
            <h2>{filteredCases.length} matching cases</h2>
          </div>
        </header>
        <div className="card-stack">
          {filteredCases.map((record) => {
            const prediction = resolvePrediction(record);
            const risk = resolveRisk(record);
            const probability =
              typeof record.inference.probability === 'number'
                ? record.inference.probability
                : null;

            return (
              <article className="case-card" key={record.id}>
                <div className="case-main">
                  <div>
                    <p className="case-title">{record.demographics.caseLabel}</p>
                    <p className="case-meta">
                      {record.id} • {record.demographics.ageMonths} months •{' '}
                      {record.demographics.sex} • {formatDateTime(record.submittedAt)}
                    </p>
                  </div>
                  <p className="case-notes">{record.notes}</p>
                </div>
                <div className="case-side">
                  <p className="prediction">{prediction}</p>
                  <p className={`risk risk-${risk}`}>{risk}</p>
                  {probability !== null ? (
                    <p className="probability">{(probability * 100).toFixed(1)}%</p>
                  ) : null}
                  <Link to={`/cases/${record.id}`} className="text-link">
                    View details
                  </Link>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="text-link button-link danger-link"
                      onClick={() => {
                        void handleRemoveCase(record.id);
                      }}
                    >
                      Remove case
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
