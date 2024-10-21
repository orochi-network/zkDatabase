export type TResultType = "error" | "undefined" | "data";

export type TResult<T> = T | any | undefined | null;

export class GraphQLResult<T> {
  private type: TResultType;

  private result: TResult<T>;

  private constructor(result: TResult<T>) {
    if (result instanceof Error) {
      this.type = "error";
      this.result = result;
    } else if (result === null || typeof result === "undefined") {
      this.type = "undefined";
      this.result = undefined;
    } else if (Array.isArray(result) && result.length === 0) {
      this.type = "data";
      this.result = result;
    } else if (
      Array.isArray(result) &&
      result.every((e) => e instanceof Error)
    ) {
      this.type = "error";
      this.result = result;
    } else {
      this.type = "data";
      this.result = result;
    }
  }

  public static wrap<T>(result: TResult<T>): GraphQLResult<T> {
    return new GraphQLResult(result);
  }

  public get length(): number {
    if (this.isArray()) {
      return (this.result as T[]).length;
    }
    return this.isValid() ? 1 : 0;
  }

  public isError(): boolean {
    return this.type === "error";
  }

  public isUndefined(): boolean {
    return this.type === "undefined";
  }

  public isValid(): boolean {
    return this.type === "data";
  }

  public isArray(): boolean {
    return typeof this.result === "object" && Array.isArray(this.result);
  }

  public isObject(): boolean {
    return typeof this.result === "object" && !Array.isArray(this.result);
  }

  /**
   * Checks if the result contains exactly one object.
   */
  public isOne(): boolean {
    return this.isValid() && this.length === 1;
  }

  /**
   * Checks if the result contains one or more objects.
   */
  public isSome(): boolean {
    return this.isValid() && this.length > 0;
  }

  /**
   * Checks if the result contains more than one item.
   */
  public isMany(): boolean {
    return this.isArray() && this.length > 1;
  }

  public unwrap(): T {
    if (this.isValid()) {
      return this.result as T;
    }
    if (this.isError()) {
      throw this.result as Error;
    }
    throw new Error("Expected an error but found none");
  }
}
