export class CompilerError extends Error {
  constructor(line, message) {
    super('[line ' + line + '] ' + message);
  }
}
