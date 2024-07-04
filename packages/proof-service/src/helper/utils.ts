export function isEmptyArray(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0;
}