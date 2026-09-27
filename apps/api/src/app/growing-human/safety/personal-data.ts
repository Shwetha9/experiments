/**
 * Removes obvious identifying details before they can leave the BFF. This is a
 * defence in depth measure; the guide prompt also forbids requesting or echoing
 * personal data. The original request is never persisted or logged.
 */
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /\b(?:\+?61\s?4|04)\d(?:[\s-]?\d){7,8}\b/g;
const STREET_ADDRESS =
  /\b\d{1,5}\s+[A-Za-z][A-Za-z' -]{1,50}\s(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct)\b/gi;
const SELF_IDENTIFICATION = /\b(?:my name is|i['’]m|i am)\s+([A-Z][A-Za-z'-]{1,30})\b/g;
const SCHOOL = /\b[A-Z][A-Za-z' -]{1,60}\s+(?:Public|Primary|High|Secondary)(?:\s+School)?\b/g;

export interface SanitisedText {
  readonly text: string;
  /** Fragments that must not appear in a generated reply. */
  readonly removedValues: readonly string[];
}

export const redactPersonalData = (value: string): SanitisedText => {
  const removedValues: string[] = [];
  let text = value;

  text = text.replace(SELF_IDENTIFICATION, (match, name: string) => {
    removedValues.push(match, name);
    return '[personal detail removed]';
  });
  text = text.replace(SCHOOL, (match) => {
    removedValues.push(match);
    return '[personal detail removed]';
  });

  for (const pattern of [EMAIL, PHONE, STREET_ADDRESS]) {
    text = text.replace(pattern, (match) => {
      removedValues.push(match);
      return '[personal detail removed]';
    });
  }

  return { text, removedValues };
};

export const containsRemovedPersonalData = (
  value: string,
  removedValues: readonly string[],
): boolean => {
  const normalized = value.toLocaleLowerCase();
  return removedValues.some((removed) => normalized.includes(removed.toLocaleLowerCase()));
};
