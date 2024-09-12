export type TResultType = "error" | "object" | "array" | "undefined";

export class GraphQLResult<T> {
  private type: TResultType;
  private result: T | T[] | Error | undefined | null;

  private constructor(result: T | T[] | Error | undefined | null) {
    if (result instanceof Error) {
      this.type = "error";
      this.result = result;
    } else if (result === null || typeof result === "undefined") {
      this.type = "undefined";
      this.result = undefined;
    } else if (Array.isArray(result)) {
      this.type = "array";
      this.result = result;
    } else {
      this.type = "object";
      this.result = result;
    }
  }

  public static wrap<T>(
    result: T | T[] | Error |  undefined | null
  ): GraphQLResult<T> {
    return new GraphQLResult(result);
  }

  public get length(): number {
    if (this.isArray()) {
      return (this.result as T[]).length;
    }
    return this.isObject() ? 1 : 0;
  }

  public isError(): boolean {
    return this.type === "error";
  }

  public isUndefined(): boolean {
    return this.type === "undefined";
  }

  public isValid(): boolean {
    return this.type === "object" || this.type === "array";
  }

  public isArray(): boolean {
    return this.type === "array";
  }

  public isObject(): boolean {
    return this.type === "object";
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

  public unwrapObject(): T {
    if (this.isObject()) {
      return this.result as T;
    }
    throw new Error("Expected an object but found none");
  }

  public unwrapArray(): T[] {
    if (this.isArray()) {
      return this.result as T[];
    }
    throw new Error("Expected an array but found none");
  }

  public unwrapOne(): T {
    if (this.isObject()) {
      return this.unwrapObject();
    } else if (this.isArray() && this.length > 0) {
      return this.unwrapArray()[0];
    }
    throw new Error("Expected at least one item, but found none");
  }

  public unwrapError(): Error {
    if (this.isError()) {
      return this.result as Error;
    }
    throw new Error("Expected an error but found none");
  }
}
