import { Singleton } from '@orochi-network/framework';

export class AppErrorClass extends Error {
  public statusCode: number;

  public message: string;

  constructor(statusCode: number = 500, message: string = 'Something wrong') {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

const AppError = (statusCode: number, message: string) =>
  Singleton<AppErrorClass>(
    `[AppError:${statusCode}]${message}`,
    AppErrorClass,
    statusCode,
    message
  );

export default AppError;
