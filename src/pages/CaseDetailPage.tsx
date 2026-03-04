import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../components/AuthContext';
import { ProbabilityBars } from '../components/ProbabilityBars';
import { formatDate, formatDateTime } from '../lib/format';
import {
  loadCaseRecord,
  removeCaseRecord,
  retryCasePrediction
} from '../lib/remote-data';
import { CaseRecord } from '../types';

export function CaseDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let mounted = true;

    async function fetchCase() {
      const currentCaseId = caseId;
      if (!currentCaseId) {
        setLoading(false);
        setError('Missing case id.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextRecord = await loadCaseRecord(currentCaseId);
        if (!mounted) {
          return;
        }
        if (!nextRecord) {
          setError('Case not found.');
          setRecord(null);
          return;
        }
        setRecord(nextRecord);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load case.');
          setRecord(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchCase();

    return () => {
      mounted = false;
    };
  }, [caseId]);

  if (loading) {
    return (
      <section className="panel">
        <h1>Loading case...</h1>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="panel">
        <h1>Case not found</h1>
        <p>{error ?? 'The selected case id does not exist.'}</p>
        <Link to="/cases" className="text-link">
          Back to Case Library
        </Link>
      </section>
    );
  }

  const handleRetry = async () => {
    if (!caseId || retrying) {
      return;
    }
    setRetrying(true);
    setError(null);
    const result = await retryCasePrediction(caseId);
    if (!result.success || !result.caseRecord) {
      setError(result.error ?? 'Retry failed.');
      setRetrying(false);
      return;
    }
    setRecord(result.caseRecord);
    setRetrying(false);
  };

  const handleRemove = async () => {
    if (!caseId || !isAdmin || removing) {
      return;
    }
    if (!window.confirm(`Remove case ${caseId}?`)) {
      return;
    }
    setRemoving(true);
    setError(null);
    const result = await removeCaseRecord(caseId);
    if (!result.success) {
      setError(result.error ?? 'Failed to remove case.');
      setRemoving(false);
      return;
    }
    navigate('/cases', { replace: true });
  };

  const probability =
    typeof record.inference.probability === 'number'
      ? `${(record.inference.probability * 100).toFixed(1)}%`
      : 'N/A';
  const categories = Array.isArray(record.inference.categories)
    ? record.inference.categories
    : [];
  const actions = Array.isArray(record.inference.recommendedActions)
    ? record.inference.recommendedActions
    : [];

  return (
    <div className="page-flow">
      <section className="panel hero-panel">
        <p className="eyebrow">Case Detail</p>
        <h1>{record.demographics.caseLabel}</h1>
        <p>
          {record.id} • Submitted {formatDate(record.submittedAt)} •{' '}
          {record.demographics.ageMonths} months • {record.demographics.sex}
        </p>
        <div className="inline-links">
          <button
            type="button"
            className="text-link button-link"
            onClick={() => {
              void handleRetry();
            }}
            disabled={retrying}
          >
            {retrying ? 'Retrying...' : 'Retry analysis'}
          </button>
          {isAdmin ? (
            <button
              type="button"
              className="text-link danger-link"
              onClick={() => {
                void handleRemove();
              }}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Remove case'}
            </button>
          ) : null}
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="inline-links">
          <Link to="/cases" className="text-link">
            ← Back to Case Library
          </Link>
          <Link to={`/predict?caseId=${record.id}`} className="text-link">
            Open Predictive Lab →
          </Link>
        </div>
      </section>

      <section className="panel detail-grid">
        <article>
          <p className="eyebrow">Inference result</p>
          <h2>{record.inference.topPrediction}</h2>
          <div className="metric-list">
            <p>
              <strong>Probability:</strong> {probability}
            </p>
            <p>
              <strong>Risk level:</strong> {record.inference.riskLevel ?? 'N/A'}
            </p>
            <p>
              <strong>Confidence:</strong>{' '}
              {typeof record.inference.confidence === 'number'
                ? `${(record.inference.confidence * 100).toFixed(1)}%`
                : 'N/A'}
            </p>
            <p>
              <strong>Submitted:</strong> {formatDateTime(record.submittedAt)}
            </p>
          </div>
          {categories.length ? <ProbabilityBars categories={categories} /> : null}
        </article>
        <article>
          <p className="eyebrow">Recommended actions</p>
          <h2>Next steps</h2>
          <ul className="plain-list">
            {actions.length
              ? actions.map((action) => (
                  <li key={action}>{action}</li>
                ))
              : [
                  <li key="fallback">
                    Consult with qualified clinicians for diagnostic confirmation
                    and intervention planning.
                  </li>
                ]}
          </ul>
          <p className="note-block">
            Clinical disclaimer: this output is a screening aid, not a formal
            diagnosis.
          </p>
        </article>
      </section>

      <section className="panel detail-grid">
        <DataList
          title="Demographics"
          items={[
            ['Prenatal factors', record.demographics.prenatalFactors.join(', ')],
            [
              'Parental age',
              `Mother ${record.demographics.parentalAge.mother}, Father ${record.demographics.parentalAge.father}`
            ],
            [
              'Diagnostic age',
              `${record.demographics.diagnosticAgeMonths} months`
            ]
          ]}
        />
        <DataList
          title="Development and behavior"
          items={[
            ['Delays', record.development.delays.join(', ')],
            [
              'Dysmorphic features',
              record.development.dysmorphicFeatures ? 'Yes' : 'No'
            ],
            ['Comorbidities', record.development.comorbidities.join(', ') || '-'],
            [
              'Regression observed',
              record.development.regressionObserved ? 'Yes' : 'No'
            ],
            ['Language level', record.behaviors.languageLevel],
            ['Behavior concerns', record.behaviors.concerns.join(', ')],
            ['Sensory notes', record.behaviors.sensoryNotes || '-']
          ]}
        />
        <DataList
          title="Assessments"
          items={[
            ['ADOS score', String(record.assessments.adosScore)],
            ['ADI-R score', String(record.assessments.adirScore)],
            ['IQ / DQ', String(record.assessments.iqDq)],
            [
              'EEG anomalies',
              record.assessments.eegAnomalies ? 'Detected' : 'Not detected'
            ],
            ['MRI findings', record.assessments.mriFindings ?? '-'],
            ['Neurological exam', record.assessments.neurologicalExam],
            [
              'Head circumference',
              `${record.assessments.headCircumference} cm`
            ]
          ]}
        />
      </section>
    </div>
  );
}

function DataList({
  title,
  items
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <article className="mini-panel">
      <h3>{title}</h3>
      <dl>
        {items.map(([label, value]) => (
          <div className="mini-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
