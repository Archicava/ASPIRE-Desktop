export type PrenatalFactor = 'Natural' | 'IVF' | 'Twin' | 'Complication';

export type DevelopmentalDelay =
  | 'None'
  | 'Motor'
  | 'Language'
  | 'Cognitive'
  | 'Global';

export type IntellectualDisability = 'N' | 'F70.0' | 'F71' | 'F72';

export type BehaviorConcern =
  | 'None'
  | 'Aggressivity'
  | 'Self-injury'
  | 'Agitation'
  | 'Stereotypy'
  | 'Hyperactivity'
  | 'Sleep'
  | 'Sensory';

export type RiskLevel = 'low' | 'medium' | 'high';

export type CaseSubmission = {
  demographics: {
    caseLabel: string;
    ageMonths: number;
    sex: 'Male' | 'Female';
    parentalAge: {
      mother: number;
      father: number;
    };
    diagnosticAgeMonths: number;
    prenatalFactors: PrenatalFactor[];
  };
  development: {
    delays: DevelopmentalDelay[];
    dysmorphicFeatures: boolean;
    intellectualDisability: IntellectualDisability;
    comorbidities: string[];
    regressionObserved: boolean;
  };
  assessments: {
    adosScore: number;
    adirScore: number;
    iqDq: number;
    eegAnomalies: boolean;
    mriFindings: string | null;
    neurologicalExam: string;
    headCircumference: number;
  };
  behaviors: {
    concerns: BehaviorConcern[];
    languageLevel: 'Functional' | 'Delayed' | 'Absent';
    languageDisorder?: boolean;
    sensoryNotes: string;
  };
  notes: string;
};

export type InferenceCategory = {
  label: string;
  probability: number;
  narrative?: string;
};

export type InferenceResult = {
  topPrediction: string;
  prediction?: 'Healthy' | 'ASD';
  probability?: number;
  confidence?: number;
  riskLevel?: RiskLevel;
  categories: InferenceCategory[];
  explanation: string;
  recommendedActions: string[];
};

export type CaseRecord = CaseSubmission & {
  id: string;
  submittedAt: string;
  inference: InferenceResult;
  jobId?: string;
  artifacts?: {
    payloadCid?: string;
    payloadPath?: string;
  };
};

export type InferenceJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type InferenceJob = {
  id: string;
  caseId: string;
  status: InferenceJobStatus;
  submittedAt: string;
  completedAt?: string;
  edgeNode?: string;
  payloadCid?: string;
  result?: InferenceResult;
  error?: string;
  statusHistory: Array<{
    status: InferenceJobStatus;
    timestamp: string;
    message?: string;
  }>;
};

export type CohortSeedEntry = {
  caseId: string;
  gender: 'Male' | 'Female';
  pregnancyType: string;
  plurality: string;
  pregnancyEvolution: string;
  languageLevel: 'Functional' | 'Delayed' | 'Absent';
  eegStatus: string;
  mriStatus: string;
  diagnosisAgeMonths: number | null;
  delays: string[];
  adosScore: number | null;
  adirScore: number | null;
};

export type CohortStats = {
  totalCases: number;
  gender: Record<'male' | 'female', number>;
  pregnancy: {
    natural: number;
    ivf: number;
    twin: number;
    abnormalEvolution: number;
  };
  language: Record<'functional' | 'delayed' | 'absent', number>;
  delays: Record<'Global' | 'Motor' | 'Cognitive', number>;
  diagnosisAge: {
    mean: number | null;
    median: number | null;
  };
  eegAnomalyRate: number;
  mriAnomalyRate: number;
};

export type PredictiveInput = {
  caseId?: string;
  ageMonths: number;
  languageLevel: 'Functional' | 'Delayed' | 'Absent';
  eegStatus: 'Normal' | 'Focal' | 'Bilateral';
  mriStatus: 'Normal' | 'Anomaly' | 'Unknown';
  prenatalFactors: PrenatalFactor[];
  developmentalDelays: DevelopmentalDelay[];
  dysmorphicFeatures: boolean;
  behavioralConcerns: number;
  comorbidities: number;
};

export type PredictiveScenario = {
  label: string;
  probability: number;
  narrative: string;
};

export type PredictiveResult = {
  topFinding: string;
  scenarios: PredictiveScenario[];
  riskSummary: string;
  recommendations: string[];
};

export type AuthUser = {
  username: string;
  displayName: string;
  role?: string;
  metadata?: Record<string, unknown>;
};

export type UserRecord = {
  username: string;
  role?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
