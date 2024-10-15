const NODE_MODULES = {
  path: 'path',
  ftp: 'basic-ftp',
  fs: 'fs/promises',
  // Add more modules here as needed
};
type NodeDependencies = {
  [key in keyof typeof NODE_MODULES]: any;
};
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

export async function getNodeDependencies(): Promise<NodeDependencies | null> {
  if (!isNode()) {
    return null;
  }
  const dependencies = {} as NodeDependencies;
  for (const [key, modulePath] of Object.entries(NODE_MODULES)) {
    try {
      dependencies[key as keyof typeof NODE_MODULES] = await import(modulePath);
    } catch (error) {
      console.error(`Failed to import ${modulePath}:`, error);
    }
  }
  return dependencies;
}
