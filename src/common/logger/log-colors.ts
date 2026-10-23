// ANSI color helpers for highlighting a specific log message.
// Usage: this.logger.log(LogColor.red('Server running on port 3000'))
// Respects the NO_COLOR env var, like Nest's own logger.
const wrap = (code: number) => (text: string) =>
  process.env.NO_COLOR ? text : `\x1b[${code}m${text}\x1b[39m`;

export const LogColor = {
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
  white: wrap(37),
};
