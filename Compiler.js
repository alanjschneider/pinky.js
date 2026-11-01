import { CompilerError } from './CompilerError.js';

const Type = {
  NUMBER: 0,
  STRING: 1,
  BOOL: 2,
  NULL: 3,
  AUTO: 4,
};

export const Bytecode = {
  PUSH: 0, // put a value in the top of stack
  POP: 1, // remove n values from the top of stack
  BIN_OP: 2,
  UN_OP: 3,
  PRINT: 4,
  PRINTLN: 5,
  JMP: 6, // jump to label unconditionally
  JMPZ: 7, // jump to label if the value on top of stack is zero
  LOAD: 8, // search in frame and push to stack
  STORE: 9, // pop from stack and store in frame
  LOAD_LOCAL: 10,
  STORE_LOCAL: 11,
  HALT: 12,
};

export const Mnemonic = Object.keys(Bytecode);

export class Compiler {
  constructor() {
    this.output = [];
    this.labels = {};
    this.localsCount = 0;
    this.globals = {};
    this.frames = []; // frame = { index: number, frame: number };
    this.pc = 0;
    this.labelsCount = 0;
  }

  emit(...args) {
    this.pc += args.length;
    this.output.push(...args);
  }

  getSymbol(name) {
    for (let i = this.frames.length - 1; i > -1; i--) {
      const frame = this.frames[i];
      if (frame.has(name)) return frame.get(name);
    }

    if (this.globals[name]) return this.globals[name];
    return null;
  }

  makeLabel(label) {
    this.labels[label] = this.pc;
  }

  generateLabelName() {
    return 'L' + this.labelsCount++;
  }

  startFrame() {
    this.frames.push(new Map());
  }

  endFrame() {
    const currentFrame = this.frames.pop();
    this.emit(Bytecode.POP, currentFrame.size);
    this.localsCount -= currentFrame.size;
  }

  Number(ast) {
    this.emit(Bytecode.PUSH, ast.value);
    return Type.NUMBER;
  }

  String(ast) {
    this.emit(Bytecode.PUSH, ast.value);
    return Type.STRING;
  }

  Bool(ast) {
    this.emit(Bytecode.PUSH, ast.value);
    return Type.BOOL;
  }

  Identifier(ast) {
    const symbol = this.getSymbol(ast.name);
    if (symbol === null) {
      throw new CompilerError(
        ast.line,
        `Reference error: ${ast.name} is not defined.`,
      );
    }

    if (symbol.frame > 0) {
      this.emit(Bytecode.LOAD_LOCAL, symbol.index);
    } else {
      this.emit(Bytecode.LOAD, ast.name);
    }

    return Type.AUTO;
  }

  AssignStatement(ast) {
    this.compile(ast.right);

    const name = ast.left.name;
    const symbol = this.getSymbol(name);

    if (ast.local) {
      if (symbol !== null && symbol.frame > 0) {
        throw new CompilerError(
          ast.line,
          `Declaration error: local variable ${name} has already been declared.`,
        );
      }

      if (this.frames.length === 0)
        throw new CompilerError(
          ast.line,
          `Local variables only be allowed inside a block (if/while/for/func).`,
        );

      const currentFrame = this.frames.at(-1);
      this.emit(Bytecode.STORE_LOCAL, this.localsCount);
      currentFrame.set(name, {
        index: this.localsCount++,
        frame: this.frames.length,
      });
      return;
    }

    if (symbol === null) {
      this.globals[name] = { index: name, frame: 0 };
      this.emit(Bytecode.STORE, name);
      return;
    }

    if (symbol.frame > 0) {
      this.emit(Bytecode.STORE_LOCAL, symbol.index);
    } else {
      this.emit(Bytecode.STORE, name);
    }
  }

  UnaryExpression(ast) {
    const rightType = this.compile(ast.right);
    this.emit(Bytecode.UN_OP);
    switch (ast.operator) {
      case '+':
      case '-':
        if (rightType !== Type.NUMBER) {
          throw new CompilerError(ast.line, 'Invalid unary operation.');
        }
        this.emit(ast.operator);
        return Type.NUMBER;
      case '~':
        if (rightType !== Type.BOOL) {
          throw new CompilerError(ast.line, 'Invalid unary operation.');
        }
        this.emit(ast.operator);
        return Type.BOOL;
    }
  }

  BinaryExpression(ast) {
    const leftType = this.compile(ast.left);
    const rightType = this.compile(ast.right);

    this.emit(Bytecode.BIN_OP);

    switch (ast.operator) {
      case '+':
        if (leftType === Type.STRING || rightType === Type.STRING) {
          this.emit(ast.operator);
          return Type.STRING;
        }

        if (leftType !== Type.AUTO && rightType !== Type.AUTO) {
          if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
            throw new CompilerError(ast.line, 'Invalid aritmetic operation.');
          }
        }

        this.emit(ast.operator);
        return Type.NUMBER;

      case '-':
      case '*':
      case '/':
      case '^':
      case '%':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new CompilerError(ast.line, 'Invalid aritmetic operation.');
        }

        this.emit(ast.operator);
        return Type.NUMBER;

      case 'and':
      case 'or':
        if (leftType !== Type.BOOL || rightType !== Type.BOOL) {
          throw new CompilerError(ast.line, 'Invalid boolean operation.');
        }

        this.emit(ast.operator);
        return Type.BOOL;

      case '<':
      case '<=':
      case '>':
      case '>=':
        if (leftType !== Type.AUTO && rightType !== Type.AUTO) {
          if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
            throw new CompilerError(ast.line, 'Invalid logic comparison.');
          }
        }

        this.emit(ast.operator);
        return Type.BOOL;

      case '==':
      case '~=':
        this.emit(ast.operator);
        return Type.BOOL;
    }
  }

  FuncDeclaration(ast) {}

  WhileStatement(ast) {
    const end = this.generateLabelName();
    const start = this.generateLabelName();
    this.makeLabel(start);
    this.compile(ast.test);
    this.emit(Bytecode.JMPZ, end);
    this.startFrame();
    this.compile(ast.body);
    this.endFrame();
    this.emit(Bytecode.JMP, start);
    this.makeLabel(end);
  }

  ForStatement(ast) {
    const end = this.generateLabelName();
    const start = this.generateLabelName();
    this.startFrame();
    this.compile(ast.start);
    const symbol = this.getSymbol(ast.start.left.name);
    this.makeLabel(start);
    this.emit(Bytecode.LOAD_LOCAL, symbol.index);
    this.compile(ast.max);
    this.emit(Bytecode.BIN_OP, '<');
    this.emit(Bytecode.JMPZ, end);
    this.compile(ast.body);
    this.emit(Bytecode.LOAD_LOCAL, symbol.index);
    this.compile(ast.step);
    this.emit(Bytecode.BIN_OP, '+');
    this.emit(Bytecode.STORE_LOCAL, symbol.index);
    this.emit(Bytecode.JMP, start);
    this.endFrame();
    this.makeLabel(end);
  }

  IfStatement(ast, endLabel = null) {
    const end = endLabel ?? this.generateLabelName();
    const alternate = this.generateLabelName();

    this.compile(ast.test);
    if (ast.alternate !== null) this.emit(Bytecode.JMPZ, alternate);
    else this.emit(Bytecode.JMPZ, end);

    this.startFrame();
    this.compile(ast.consequent);
    this.endFrame();

    if (ast.alternate !== null) {
      this.emit(Bytecode.JMP, end);
      this.makeLabel(alternate);
      if (ast.alternate.type === 'IfStatement') {
        this.IfStatement(ast.alternate, end);
      } else {
        this.compile(ast.alternate);
      }
    }

    if (endLabel === null) this.makeLabel(end);
  }

  PrintStatement(ast) {
    this.compile(ast.expression);
    if (ast.end === '') this.emit(Bytecode.PRINT);
    else this.emit(Bytecode.PRINTLN);
  }

  Statements(ast) {
    for (const statement of ast.body) {
      this.compile(statement);
    }
  }

  Program(ast) {
    this.labels['START'] = this.pc;
    this.compile(ast.body);
    this.emit(Bytecode.HALT);
  }

  compile(ast) {
    if (!this[ast.type]) {
      throw new Error('Invalid code.');
    }
    return this[ast.type](ast);
  }
}
