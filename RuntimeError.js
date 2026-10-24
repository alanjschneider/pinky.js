export class RuntimeError extends Error {
  constructor(line, message) {
    super('[line ' + line + '] ' + message);
  }
}
