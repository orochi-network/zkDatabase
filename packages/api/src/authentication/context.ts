export class Context<T = any> {
  static #instances: Map<string, Context> = new Map();

  #contextCallback: () => T | null = () => null;

  getInstance<T>(instanceName: string = "default"): Context<T> {
    if (!Context.#instances.has(instanceName)) {
      Context.#instances.set(instanceName, new Context());
    }
    return Context.#instances.get(instanceName) as Context<T>;
  }

  setContextCallback(fn: () => T | null): void {
    this.#contextCallback = fn;
  }

  public getContext(): T | null {
    return this.#contextCallback();
  }
}
