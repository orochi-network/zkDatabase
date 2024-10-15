export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

export async function getNodeDependencies() {
  if (isNode()) {
    const path = await import('path');
    const ftp = await import('basic-ftp');
    const fs = await import('fs/promises');
    return { path, ftp, fs };
  }
  return null;
}
