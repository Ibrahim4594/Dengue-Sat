/**
 * DengueSat — Symptom Checker
 * User taps symptoms → AI calculates dengue probability → nearest hospital
 */

import { Symptom, DiagnosisResult, HospitalData } from './types';

interface SymptomWeight {
  symptom: Symptom;
  label: string;
  labelUrdu: string;
  weight: number;
  icon: string;
}

export const SYMPTOMS: SymptomWeight[] = [
  { symptom: 'fever', label: 'High Fever (>38°C)', labelUrdu: 'تیز بخار', weight: 0.25, icon: '🌡️' },
  { symptom: 'headache', label: 'Severe Headache', labelUrdu: 'شدید سر درد', weight: 0.15, icon: '🤕' },
  { symptom: 'joint_pain', label: 'Joint/Muscle Pain', labelUrdu: 'جوڑوں میں درد', weight: 0.15, icon: '💪' },
  { symptom: 'rash', label: 'Skin Rash', labelUrdu: 'جلد پر دانے', weight: 0.12, icon: '🔴' },
  { symptom: 'bleeding', label: 'Bleeding (nose/gums)', labelUrdu: 'ناک/مسوڑھوں سے خون', weight: 0.15, icon: '🩸' },
  { symptom: 'nausea', label: 'Nausea/Vomiting', labelUrdu: 'متلی/الٹی', weight: 0.08, icon: '🤢' },
  { symptom: 'fatigue', label: 'Extreme Fatigue', labelUrdu: 'شدید تھکاوٹ', weight: 0.05, icon: '😴' },
  { symptom: 'eye_pain', label: 'Pain Behind Eyes', labelUrdu: 'آنکھوں کے پیچھے درد', weight: 0.05, icon: '👁️' },
];

export function checkSymptoms(
  selectedSymptoms: Symptom[],
  hospitals: HospitalData[]
): DiagnosisResult {
  if (selectedSymptoms.length === 0) {
    return {
      probability: 0,
      severity: 'mild',
      recommendation: 'Please select your symptoms for analysis.',
      recommendationUrdu: 'تجزیے کے لیے اپنی علامات منتخب کریں۔',
      nearestHospital: null,
      disclaimer: 'This is not medical advice. Consult a doctor.',
    };
  }

  // Calculate weighted probability
  let totalWeight = 0;
  const maxWeight = SYMPTOMS.reduce((sum, s) => sum + s.weight, 0);

  for (const symptom of selectedSymptoms) {
    const sw = SYMPTOMS.find(s => s.symptom === symptom);
    if (sw) totalWeight += sw.weight;
  }

  let probability = Math.round((totalWeight / maxWeight) * 100);

  // Bonus: fever + joint pain + headache = classic dengue triad
  const hasTriad = selectedSymptoms.includes('fever') &&
    selectedSymptoms.includes('joint_pain') &&
    selectedSymptoms.includes('headache');
  if (hasTriad) probability = Math.min(probability + 15, 98);

  // Bleeding is a severe dengue indicator
  const hasBleeding = selectedSymptoms.includes('bleeding');
  if (hasBleeding && probability > 50) probability = Math.min(probability + 10, 98);

  // Determine severity
  let severity: DiagnosisResult['severity'] = 'mild';
  if (probability > 70 || hasBleeding) severity = 'severe';
  else if (probability > 40) severity = 'moderate';

  // Recommendations
  let recommendation = '';
  let recommendationUrdu = '';

  if (severity === 'severe') {
    recommendation = `${probability}% likely dengue → Go to emergency immediately. Request platelet count test.`;
    recommendationUrdu = `${probability}% ڈینگی کا امکان → فوری طور پر ایمرجنسی جائیں۔ پلیٹلیٹ ٹیسٹ کروائیں۔`;
  } else if (severity === 'moderate') {
    recommendation = `${probability}% likely dengue → Visit your nearest hospital. Stay hydrated and rest.`;
    recommendationUrdu = `${probability}% ڈینگی کا امکان → قریبی ہسپتال جائیں۔ پانی پیتے رہیں اور آرام کریں۔`;
  } else {
    recommendation = `${probability}% likely dengue → Monitor symptoms. If fever persists >2 days, visit a doctor.`;
    recommendationUrdu = `${probability}% ڈینگی کا امکان → علامات کی نگرانی کریں۔ بخار 2 دن سے زیادہ رہے تو ڈاکٹر سے ملیں۔`;
  }

  // Find nearest hospital with available beds
  const nearestHospital = hospitals
    .filter(h => h.availableBeds > 0)
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0] || null;

  if (nearestHospital) {
    recommendation += ` → Nearest: ${nearestHospital.name} (${nearestHospital.availableBeds} beds, ${nearestHospital.distanceKm?.toFixed(1)}km)`;
    recommendationUrdu += ` → قریبی: ${nearestHospital.nameUrdu} (${nearestHospital.availableBeds} بستر، ${nearestHospital.distanceKm?.toFixed(1)} کلومیٹر)`;
  }

  return {
    probability,
    severity,
    recommendation,
    recommendationUrdu,
    nearestHospital,
    disclaimer: ' یہ طبی مشورہ نہیں ہے۔ ڈاکٹر سے مشورہ کریں۔ | This is NOT medical advice. Consult a qualified doctor.',
  };
}
