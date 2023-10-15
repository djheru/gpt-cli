export const logger = (verboseOnly: boolean) => ({
  log: (...args: any[]) => {
    console.log(...args);
  },
  vlog: (...args: any[]) => {
    if (verboseOnly) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
});
