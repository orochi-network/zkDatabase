export type Filter<T extends new (..._args: any) => any> = Partial<
  InstanceType<T>
>;
