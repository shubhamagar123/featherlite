export interface IResult<T> {
  isSuccess: boolean;
  isFailure: boolean;
  value?: T;
  error?: Error;
  getValueOrThrow(): T;
  getValueOrDefault(defaultValue: T): T;
  map<U>(fn: (value: T) => U): IResult<U>;
  flatMap<U>(fn: (value: T) => IResult<U>): IResult<U>;
  fold<U>(onFailure: (error: Error) => U, onSuccess: (value: T) => U): U;
}

export class Result<T = void> implements IResult<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly isFailure: boolean,
    public readonly value?: T,
    public readonly error?: Error
  ) {
    Object.freeze(this);
  }

  static success<U = void>(value?: U): IResult<U> {
    return new Result(true, false, value, undefined) as IResult<U>;
  }

  static failure<U = void>(error: Error): IResult<U> {
    return new Result(false, true, undefined, error) as IResult<U>;
  }

  static try<U>(fn: () => U): IResult<U> {
    try {
      return Result.success(fn());
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  static async tryAsync<U>(fn: () => Promise<U>): Promise<IResult<U>> {
    try {
      const value = await fn();
      return Result.success(value);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  getValueOrThrow(): T {
    if (this.isSuccess) return this.value as T;
    throw this.error || new Error('Result is a failure');
  }

  getValueOrDefault(defaultValue: T): T {
    return this.isSuccess ? (this.value as T) : defaultValue;
  }

  map<U>(fn: (value: T) => U): IResult<U> {
    return this.isSuccess
      ? Result.success(fn(this.value as T))
      : Result.failure(this.error!);
  }

  flatMap<U>(fn: (value: T) => IResult<U>): IResult<U> {
    return this.isSuccess
      ? fn(this.value as T)
      : Result.failure(this.error!);
  }

  fold<U>(onFailure: (error: Error) => U, onSuccess: (value: T) => U): U {
    return this.isSuccess
      ? onSuccess(this.value as T)
      : onFailure(this.error!);
  }
}
