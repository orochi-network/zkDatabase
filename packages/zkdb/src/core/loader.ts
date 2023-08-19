const singleton: { [key: string]: any } = {};

export async function LoadInstance<T>(
  instance: string,
  async: () => Promise<T>
): Promise<T> {
  if (typeof singleton[instance] === 'undefined') {
    singleton[instance] = await async();
  }
  return singleton[instance];
}
