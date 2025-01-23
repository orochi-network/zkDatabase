const loggerInstance: any = { logger: null };

export function LoggerSet(activeLogger: any) {
  loggerInstance.logger = activeLogger;
}

export const LoggerAny = <T>(): T =>
  new Proxy(loggerInstance, {
    get(_target, prop, receiver) {
      if (
        loggerInstance.logger !== null &&
        typeof loggerInstance.logger[prop] !== 'undefined'
      ) {
        return Reflect.get(loggerInstance.logger, prop, receiver);
      }
      return () => {};
    },
  }) as any;

// eslint-disable-next-line no-undef
export const logger = LoggerAny<Console>();
