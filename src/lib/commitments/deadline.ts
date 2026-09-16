const MONTH =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DAY = "\\d{1,2}(?:st|nd|rd|th)?";

const FULL_DATES = [
  /\b\d{4}-\d{2}-\d{2}\b/, // 2026-09-30
  /\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/, // 30.09.2026, 9/30/2026
  new RegExp(`\\b${DAY}\\s+(?:of\\s+)?${MONTH}\\.?,?\\s+\\d{4}\\b`, "i"), // 30 September 2026
  new RegExp(`\\b${MONTH}\\.?\\s+${DAY},?\\s+\\d{4}\\b`, "i"), // September 30, 2026
];

/**
 * True only when the wording is a full calendar date with a year. Everything
 * else ("by Friday", "next week", "before the launch", "September 30") can't
 * be placed on a calendar from the recording alone.
 */
export function isFullDate(text: string): boolean {
  return FULL_DATES.some((pattern) => pattern.test(text));
}
