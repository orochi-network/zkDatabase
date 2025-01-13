export type TSerializedBigInt<T> = {
  [K in keyof T]: T[K] extends bigint ? string : T[K];
};

export function serializeDocument<T extends Record<string, any>>(
  document: T
): TSerializedBigInt<T> {
  const serialized: TSerializedBigInt<T> = {} as any;
  const listKey = Object.keys(document);
  for (let i = 0; i < listKey.length; i += 1) {
    const key = listKey[i] as keyof TSerializedBigInt<T>;
    if (typeof document[key] === 'bigint') {
      serialized[key] = document[key].toString();
    } else {
      serialized[key] = document[key];
    }
  }
  return serialized;
}
