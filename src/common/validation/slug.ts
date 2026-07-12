export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return value.length >= 1 && value.length <= 80 && SLUG_PATTERN.test(value);
}
