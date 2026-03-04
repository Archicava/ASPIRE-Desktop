import cohortCaseMap from '../data/cohort-cstore.json';
import cohortSeed from '../data/cohort-seed.json';
import {
  CaseRecord,
  CohortSeedEntry,
  CohortStats,
  InferenceJob,
  InferenceJobStatus,
  PredictiveInput
} from '../types';

const caseRecords = Object.values(cohortCaseMap as Record<string, CaseRecord>);
const seedEntries = cohortSeed as CohortSeedEntry[];

export function getCaseRecords(): CaseRecord[] {
  return [...caseRecords].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function getCaseRecord(caseId: string): CaseRecord | undefined {
  return caseRecords.find((record) => record.id === caseId);
}

export function getSeedEntries(): CohortSeedEntry[] {
  return [...seedEntries];
}

export function getCohortStats(): CohortStats {
  const total = seedEntries.length;

  const gender = {
    male: seedEntries.filter((entry) => entry.gender === 'Male').length,
    female: seedEntries.filter((entry) => entry.gender === 'Female').length
  };

  const pregnancy = {
    natural: seedEntries.filter((entry) => entry.pregnancyType === 'Natural').length,
    ivf: seedEntries.filter((entry) => entry.pregnancyType === 'IVF').length,
    twin: seedEntries.filter((entry) => entry.plurality === 'Twin').length,
    abnormalEvolution: seedEntries.filter((entry) => entry.pregnancyEvolution === 'Abnormal')
      .length
  };

  const language = {
    functional: seedEntries.filter((entry) => entry.languageLevel === 'Functional').length,
    delayed: seedEntries.filter((entry) => entry.languageLevel === 'Delayed').length,
    absent: seedEntries.filter((entry) => entry.languageLevel === 'Absent').length
  };

  const delays = seedEntries.reduce(
    (acc, entry) => {
      entry.delays.forEach((delay) => {
        if (delay === 'Global' || delay === 'Motor' || delay === 'Cognitive') {
          acc[delay] += 1;
        }
      });
      return acc;
    },
    { Global: 0, Motor: 0, Cognitive: 0 }
  );

  const diagnosisValues = seedEntries
    .map((entry) => entry.diagnosisAgeMonths)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  const eegAnomalyCount = seedEntries.filter(
    (entry) => entry.eegStatus !== 'Normal' && entry.eegStatus !== 'Unknown'
  ).length;
  const mriAnomalyCount = seedEntries.filter((entry) => entry.mriStatus === 'Anomaly').length;

  return {
    totalCases: total,
    gender,
    pregnancy,
    language,
    delays,
    diagnosisAge: {
      mean: diagnosisValues.length
        ? Number((diagnosisValues.reduce((sum, value) => sum + value, 0) / diagnosisValues.length).toFixed(1))
        : null,
      median: diagnosisValues.length ? computeMedian(diagnosisValues) : null
    },
    eegAnomalyRate: total ? Math.round((eegAnomalyCount / total) * 100) : 0,
    mriAnomalyRate: total ? Math.round((mriAnomalyCount / total) * 100) : 0
  };
}

export function getMockInferenceJobs(): InferenceJob[] {
  const cases = getCaseRecords().slice(0, 24);
  const statuses: InferenceJobStatus[] = [
    'succeeded',
    'succeeded',
    'running',
    'queued',
    'failed'
  ];

  return cases.map((record, index) => {
    const status = statuses[index % statuses.length];
    const submittedAt = new Date(record.submittedAt);

    const history: InferenceJob['statusHistory'] = [
      {
        status: 'queued',
        timestamp: submittedAt.toISOString()
      }
    ];

    if (status === 'running' || status === 'succeeded' || status === 'failed') {
      history.push({
        status: 'running',
        timestamp: new Date(submittedAt.getTime() + 3 * 60 * 1000).toISOString()
      });
    }

    let completedAt: string | undefined;
    let error: string | undefined;

    if (status === 'succeeded') {
      completedAt = new Date(submittedAt.getTime() + 12 * 60 * 1000).toISOString();
      history.push({
        status: 'succeeded',
        timestamp: completedAt
      });
    }

    if (status === 'failed') {
      completedAt = new Date(submittedAt.getTime() + 9 * 60 * 1000).toISOString();
      history.push({
        status: 'failed',
        timestamp: completedAt,
        message: 'Pipeline timeout while waiting for edge node output.'
      });
      error = 'Pipeline timeout while waiting for edge node output.';
    }

    return {
      id: `JOB-${record.id}-${index + 1}`,
      caseId: record.id,
      status,
      submittedAt: submittedAt.toISOString(),
      completedAt,
      error,
      statusHistory: history
    };
  });
}

export function mapCaseToPredictiveInput(record: CaseRecord): PredictiveInput {
  const eegStatus: PredictiveInput['eegStatus'] = record.assessments.eegAnomalies
    ? 'Focal'
    : 'Normal';

  const mriStatus: PredictiveInput['mriStatus'] = record.assessments.mriFindings
    ? record.assessments.mriFindings.toLowerCase().includes('normal')
      ? 'Normal'
      : 'Anomaly'
    : 'Unknown';

  return {
    caseId: record.id,
    ageMonths: record.demographics.ageMonths,
    languageLevel: record.behaviors.languageLevel,
    eegStatus,
    mriStatus,
    prenatalFactors: [...record.demographics.prenatalFactors],
    developmentalDelays: [...record.development.delays],
    dysmorphicFeatures: record.development.dysmorphicFeatures,
    behavioralConcerns: record.behaviors.concerns.length,
    comorbidities: record.development.comorbidities.length
  };
}

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
  }
  return Number(sorted[mid].toFixed(1));
}
