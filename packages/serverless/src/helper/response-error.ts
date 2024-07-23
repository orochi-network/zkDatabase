export class AppErrorClass extends Error {
  public statusCode: number;

  public message: string;

  constructor(
    statusCode: number = 500,
    message: string = 'Expected internal error'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

export const AppError = (statusCode: number, message: string): AppErrorClass =>
  new AppErrorClass(statusCode, message);

export default AppError;
