export type ILogger = {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  log: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  trace: (message: string, ...args: any[]) => void;
};

export class Logger {
  private static instance: ILogger = console;

  static setLogger(logger: ILogger) {
    Logger.instance = logger;
  }

  static error(message?: any, ...optionalParams: any[]) {
    Logger.instance.error(message, ...optionalParams);
  }

  static warn(message?: any, ...optionalParams: any[]) {
    Logger.instance.warn(message, ...optionalParams);
  }

  static info(message?: any, ...optionalParams: any[]) {
    Logger.instance.info(message, ...optionalParams);
  }

  static debug(message?: any, ...optionalParams: any[]) {
    Logger.instance.debug(message, ...optionalParams);
  }

  static trace(message?: any, ...optionalParams: any[]) {
    Logger.instance.trace(message, ...optionalParams);
  }

  static log(message?: any, ...optionalParams: any[]) {
    Logger.instance.log(message, ...optionalParams);
  }
}

export const logger = Logger;
