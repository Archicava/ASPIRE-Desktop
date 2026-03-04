import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ProbabilityBars } from '../components/ProbabilityBars';
import { computePredictiveResult } from '../lib/predictive';
import { mapCaseToPredictiveInput } from '../lib/data';
import { loadCaseRecords } from '../lib/remote-data';
import {
  CaseRecord,
  DevelopmentalDelay,
  PredictiveInput,
  PrenatalFactor
} from '../types';

const eegOptions = ['Normal', 'Focal', 'Bilateral'] as const;
const mriOptions = ['Normal', 'Anomaly', 'Unknown'] as const;
const prenatalOptions: PrenatalFactor[] = ['Natural', 'IVF', 'Twin', 'Complication'];
const delayOptions: DevelopmentalDelay[] = ['Global', 'Cognitive', 'Motor'];

const defaultInput: PredictiveInput = {
  caseId: undefined,
  ageMonths: 48,
  languageLevel: 'Delayed',
  eegStatus: 'Normal',
  mriStatus: 'Unknown',
  prenatalFactors: ['Natural'],
  developmentalDelays: ['Cognitive'],
  dysmorphicFeatures: false,
  behavioralConcerns: 1,
  comorbidities: 0
};

export function PredictivePage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const caseIdFromQuery = searchParams.get('caseId') ?? undefined;

  const [selectedCase, setSelectedCase] = useState<string | 'custom'>(
    caseIdFromQuery ?? 'custom'
  );
  const [input, setInput] = useState<PredictiveInput>(defaultInput);

  useEffect(() => {
    let mounted = true;

    async function fetchCases() {
      setLoading(true);
      setError(null);
      try {
        const nextCases = await loadCaseRecords();
        if (!mounted) {
          return;
        }
        setCases(nextCases);

        if (caseIdFromQuery) {
          const seeded = nextCases.find((record) => record.id === caseIdFromQuery);
          if (seeded) {
            setSelectedCase(seeded.id);
            setInput(mapCaseToPredictiveInput(seeded));
          } else {
            setSelectedCase('custom');
            setInput(defaultInput);
          }
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
  }, [caseIdFromQuery]);

  useEffect(() => {
    if (selectedCase === 'custom') {
      return;
    }
    const selected = cases.find((record) => record.id === selectedCase);
    if (selected) {
      setInput(mapCaseToPredictiveInput(selected));
    }
  }, [cases, selectedCase]);

  const result = useMemo(() => computePredictiveResult(input), [input]);

  const updateArray = <T extends string>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];

  return (
    <div className="page-flow">
      <section className="panel hero-panel">
        <p className="eyebrow">Predictive Lab</p>
        <h1>Scenario modeling</h1>
        <p>
          Test cohort-informed what-if profiles and compare trajectory likelihoods
          before running live inference jobs.
        </p>
        {loading ? <p className="sync-note">Loading case library...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="panel">
        <header className="split-header">
          <div>
            <p className="eyebrow">Input source</p>
            <h2>Start from existing case or custom profile</h2>
          </div>
          <select
            className="input"
            value={selectedCase}
            onChange={(event) => {
              const next = event.target.value as typeof selectedCase;
              setSelectedCase(next);
              if (next === 'custom') {
                setInput(defaultInput);
              }
            }}
          >
            <option value="custom">Manual configuration</option>
            {cases.slice(0, 120).map((record) => (
              <option key={record.id} value={record.id}>
                {record.demographics.caseLabel} ({record.id})
              </option>
            ))}
          </select>
        </header>
      </section>

      <section className="panel">
        <header>
          <p className="eyebrow">Clinical inputs</p>
          <h2>Adjust risk factors</h2>
        </header>

        <div className="form-grid">
          <label>
            Age (months)
            <input
              className="input"
              type="number"
              min={6}
              max={240}
              value={input.ageMonths}
              onChange={(event) =>
                setInput((prev) => ({ ...prev, ageMonths: Number(event.target.value) }))
              }
            />
          </label>

          <label>
            Language level
            <select
              className="input"
              value={input.languageLevel}
              onChange={(event) =>
                setInput((prev) => ({
                  ...prev,
                  languageLevel: event.target.value as PredictiveInput['languageLevel']
                }))
              }
            >
              <option value="Functional">Functional</option>
              <option value="Delayed">Delayed</option>
              <option value="Absent">Absent</option>
            </select>
          </label>

          <label>
            EEG status
            <div className="chip-row">
              {eegOptions.map((option) => (
                <button
                  className={`chip ${input.eegStatus === option ? 'active' : ''}`}
                  key={option}
                  type="button"
                  onClick={() =>
                    setInput((prev) => ({ ...prev, eegStatus: option }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </label>

          <label>
            MRI findings
            <div className="chip-row">
              {mriOptions.map((option) => (
                <button
                  className={`chip ${input.mriStatus === option ? 'active' : ''}`}
                  key={option}
                  type="button"
                  onClick={() =>
                    setInput((prev) => ({ ...prev, mriStatus: option }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </label>

          <label>
            Prenatal factors
            <div className="chip-row">
              {prenatalOptions.map((option) => (
                <button
                  className={`chip ${input.prenatalFactors.includes(option) ? 'active' : ''}`}
                  key={option}
                  type="button"
                  onClick={() =>
                    setInput((prev) => ({
                      ...prev,
                      prenatalFactors: updateArray(prev.prenatalFactors, option)
                    }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </label>

          <label>
            Developmental delays
            <div className="chip-row">
              {delayOptions.map((option) => (
                <button
                  className={`chip ${input.developmentalDelays.includes(option) ? 'active' : ''}`}
                  key={option}
                  type="button"
                  onClick={() =>
                    setInput((prev) => ({
                      ...prev,
                      developmentalDelays: updateArray(prev.developmentalDelays, option)
                    }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </label>

          <label>
            Dysmorphic features
            <button
              type="button"
              className={`chip ${input.dysmorphicFeatures ? 'active' : ''}`}
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  dysmorphicFeatures: !prev.dysmorphicFeatures
                }))
              }
            >
              {input.dysmorphicFeatures ? 'Yes' : 'No'}
            </button>
          </label>

          <label>
            Behavioral concerns
            <input
              className="input"
              type="number"
              min={0}
              max={6}
              value={input.behavioralConcerns}
              onChange={(event) =>
                setInput((prev) => ({
                  ...prev,
                  behavioralConcerns: Number(event.target.value)
                }))
              }
            />
          </label>

          <label>
            Comorbidities
            <input
              className="input"
              type="number"
              min={0}
              max={6}
              value={input.comorbidities}
              onChange={(event) =>
                setInput((prev) => ({
                  ...prev,
                  comorbidities: Number(event.target.value)
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <header>
          <p className="eyebrow">Predictive scenarios</p>
          <h2>{result.topFinding}</h2>
        </header>
        <ProbabilityBars
          categories={result.scenarios.map((scenario) => ({
            label: scenario.label,
            probability: scenario.probability,
            narrative: scenario.narrative
          }))}
        />
        <p>{result.riskSummary}</p>
        <ul className="plain-list">
          {result.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
