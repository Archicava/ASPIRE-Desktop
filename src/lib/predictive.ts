import {
  PredictiveInput,
  PredictiveResult,
  PredictiveScenario
} from '../types';

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - max));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  return exps.map((value) => value / sum);
}

export function computePredictiveResult(input: PredictiveInput): PredictiveResult {
  const prenatalWeight = input.prenatalFactors.includes('Complication') ? 1.2 : 0;
  const twinWeight = input.prenatalFactors.includes('Twin') ? 0.8 : 0;

  const globalDelay = input.developmentalDelays.includes('Global');
  const cognitiveDelay = input.developmentalDelays.includes('Cognitive');
  const motorDelay = input.developmentalDelays.includes('Motor');

  const languageSeverity =
    input.languageLevel === 'Absent' ? 1 : input.languageLevel === 'Delayed' ? 0.5 : 0;
  const eegSeverity =
    input.eegStatus === 'Bilateral' ? 1.2 : input.eegStatus === 'Focal' ? 0.8 : 0;
  const mriSeverity = input.mriStatus === 'Anomaly' ? 1.1 : 0;

  const behavioralLoad = clamp(input.behavioralConcerns / 3, 0, 1.5);
  const comorbidityLoad = clamp(input.comorbidities / 3, 0, 1.5);

  let profoundScore = 2.5;
  profoundScore += languageSeverity * 3.2;
  profoundScore += eegSeverity * 2.1;
  profoundScore += behavioralLoad * 1.8;
  if (globalDelay) profoundScore += 1.4;
  if (input.dysmorphicFeatures) profoundScore += 0.6;

  let highFuncScore = 2.0;
  highFuncScore += (1 - languageSeverity) * 2.5;
  highFuncScore += input.eegStatus === 'Normal' ? 1 : 0;
  highFuncScore += input.mriStatus === 'Normal' ? 0.6 : 0;
  if (!globalDelay && !cognitiveDelay) highFuncScore += 0.9;
  highFuncScore -= behavioralLoad * 1.4;
  highFuncScore -= comorbidityLoad;

  let syndromicScore = 1.8;
  syndromicScore += input.dysmorphicFeatures ? 2.5 : 0;
  syndromicScore += mriSeverity * 2.2;
  syndromicScore += comorbidityLoad * 2.0;
  syndromicScore += prenatalWeight + twinWeight;
  if (motorDelay) syndromicScore += 0.8;

  const probabilities = softmax([profoundScore, highFuncScore, syndromicScore]);

  const scenarios: PredictiveScenario[] = [
    {
      label: 'Profound ASD with sensory dysregulation',
      probability: probabilities[0],
      narrative:
        'Language severity and EEG findings mirror the high-intensity sensory subgroup described in the cohort.'
    },
    {
      label: 'High-functioning ASD with emerging verbal skills',
      probability: probabilities[1],
      narrative:
        'Lower neurophysiological burden aligns with later-diagnosed functional trajectories.'
    },
    {
      label: 'Syndromic ASD with multi-system comorbidities',
      probability: probabilities[2],
      narrative:
        'Structural findings and comorbid load map to syndromic cases highlighted in the source study.'
    }
  ].sort((a, b) => b.probability - a.probability);

  const topScenario = scenarios[0];
  const riskSummary =
    topScenario.label === 'Profound ASD with sensory dysregulation'
      ? 'Indicators suggest a high-support sensory profile; prioritise sensory regulation and EEG follow-up.'
      : topScenario.label === 'High-functioning ASD with emerging verbal skills'
      ? 'Presentation fits a milder phenotype; focus language scaffolding and executive-function supports.'
      : 'Markers suggest syndromic investigation alongside targeted behavioural care and genetics review.';

  const recommendations: string[] = [];

  if (languageSeverity >= 1) {
    recommendations.push('Introduce AAC strategies with intensive speech-language support.');
  } else if (languageSeverity > 0) {
    recommendations.push('Expand pragmatic language interventions and parent-led modelling.');
  } else {
    recommendations.push('Maintain language enrichment and social communication coaching.');
  }

  if (eegSeverity > 0) {
    recommendations.push('Schedule neurology follow-up to assess epileptiform activity trajectory.');
  }

  if (input.dysmorphicFeatures || comorbidityLoad > 0.7) {
    recommendations.push('Coordinate genetics and multi-specialty review for syndromic etiologies.');
  }

  if (behavioralLoad > 0.6) {
    recommendations.push('Implement co-regulation programs and track behavioral triggers across settings.');
  }

  return {
    topFinding: topScenario.label,
    scenarios,
    riskSummary,
    recommendations
  };
}
