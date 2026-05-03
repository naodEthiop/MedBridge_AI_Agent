const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export function redactSensitive(input: string) {
  return input.replace(EMAIL, '[REDACTED_EMAIL]').replace(PHONE, '[REDACTED_PHONE]');
}

export function redactObject<T>(value: T): T {
  return JSON.parse(redactSensitive(JSON.stringify(value)));
}
