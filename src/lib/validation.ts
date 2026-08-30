export const CODE_PATTERN = /^[A-Z0-9]{8}$/;
export const CODE_LENGTH = 8;

export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toUpperCase();
  return CODE_PATTERN.test(trimmed) ? trimmed : null;
}
