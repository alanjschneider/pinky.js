export class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.variables = new Map();
  }

  get isGlobal() {
    return this.parent === null;
  }

  setLocalVar(name, value) {
    if (this.variables.has(name)) {
      throw new Error(
        `Declaration error: local variable ${name} has already been declared.`,
      );
    }
    this.variables.set(name, value);
  }

  setVar(name, value) {
    if (!this.variables.has(name) && !this.isGlobal) {
      this.parent.setVar(name, value);
    } else {
      this.variables.set(name, value);
    }
  }

  getVar(name) {
    if (!this.variables.has(name)) {
      if (this.parent === null) {
        throw new Error(`Reference error: ${name} is not defined.`);
      }
      return this.parent.getVar(name);
    } else {
      return this.variables.get(name);
    }
  }
}
