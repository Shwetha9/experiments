/** Categories used by the local safety gate and the provider-backed classifier. */
export type InputSafetyCategory = 'ordinary' | 'sensitive' | 'crisis' | 'disallowed';

export type OutputSafetyDecision = 'release' | 'rewrite' | 'block';

export interface InputClassification {
  readonly category: InputSafetyCategory;
  /** Only a high-confidence, schema-valid classifier response can enter the model path. */
  readonly confident: boolean;
}
