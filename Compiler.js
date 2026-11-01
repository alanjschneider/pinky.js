import { CompilerError } from './CompilerError.js';

const Type = {
  NUMBER: 0,
  STRING: 1,
  BOOL: 2,
  NULL: 3,
  AUTO: 4,
};

export const Operator = {
  PLUS: 0,
  MINUS: 1,
  STAR: 2,
  SLASH: 3,
  CARET: 4,
  MODULO: 5,
  TILDE: 6,
  AND: 7,
  OR: 8,
  LT: 9,
  LE: 10,
  GT: 11,
  GE: 12,
  EQEQ: 13,
  TILDE_EQ: 14,
};

const OperatorValue = {
  '+': Operator.PLUS,
  '-': Operator.MINUS,
  '*': Operator.STAR,
  '/': Operator.SLASH,
  '^': Operator.CARET,
  '%': Operator.MODULO,
  '~': Operator.TILDE,
  and: Operator.AND,
  or: Operator.OR,
  '<': Operator.LT,
  '<=': Operator.LE,
  '>': Operator.GT,
  '>=': Operator.GE,
  '==': Operator.EQEQ,
  '~=': Operator.TILDE_EQ,
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
    this.decode(ast.right);

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
    const rightType = this.decode(ast.right);
    this.emit(Bytecode.UN_OP);

    switch (ast.operator) {
      case '+':
      case '-':
        if (rightType !== Type.AUTO && rightType !== Type.NUMBER) {
          throw new CompilerError(ast.line, 'Invalid unary operation.');
        }
        this.emit(OperatorValue[ast.operator]);
        return Type.NUMBER;
      case '~':
        if (rightType !== Type.AUTO && rightType !== Type.BOOL) {
          throw new CompilerError(ast.line, 'Invalid unary operation.');
        }
        this.emit(OperatorValue[ast.operator]);
        return Type.BOOL;
    }
  }

  BinaryExpression(ast) {
    const leftType = this.decode(ast.left);
    const rightType = this.decode(ast.right);

    this.emit(Bytecode.BIN_OP);

    switch (ast.operator) {
      case '+':
        if (leftType === Type.STRING || rightType === Type.STRING) {
          this.emit(OperatorValue[ast.operator]);
          return Type.STRING;
        }

        if (leftType !== Type.AUTO && rightType !== Type.AUTO) {
          if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
            throw new CompilerError(ast.line, 'Invalid aritmetic operation.');
          }
        }

        this.emit(OperatorValue[ast.operator]);
        return Type.NUMBER;

      case '-':
      case '*':
      case '/':
      case '^':
      case '%':
        if (leftType !== Type.AUTO && rightType !== Type.AUTO) {
          if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
            throw new CompilerError(ast.line, 'Invalid aritmetic operation.');
          }
        }

        this.emit(OperatorValue[ast.operator]);
        return Type.NUMBER;

      case 'and':
      case 'or':
        if (leftType !== Type.AUTO && rightType !== Type.AUTO) {
          if (leftType !== Type.BOOL || rightType !== Type.BOOL) {
            throw new CompilerError(ast.line, 'Invalid boolean operation.');
          }
        }

        this.emit(OperatorValue[ast.operator]);
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

        this.emit(OperatorValue[ast.operator]);
        return Type.BOOL;

      case '==':
      case '~=':
        this.emit(OperatorValue[ast.operator]);
        return Type.BOOL;
    }
  }

  FuncDeclaration(ast) {}

  WhileStatement(ast) {
    const end = this.generateLabelName();
    const start = this.generateLabelName();
    this.makeLabel(start);
    this.decode(ast.test);
    this.emit(Bytecode.JMPZ, end);
    this.startFrame();
    this.decode(ast.body);
    this.endFrame();
    this.emit(Bytecode.JMP, start);
    this.makeLabel(end);
  }

  ForStatement(ast) {
    const end = this.generateLabelName();
    const start = this.generateLabelName();
    const negative = this.generateLabelName();
    const body = this.generateLabelName();

    this.startFrame();

    this.decode(ast.start);
    const symbol = this.getSymbol(ast.start.left.name);

    this.makeLabel(start);

    this.decode(ast.step);
    this.emit(Bytecode.PUSH, 0);
    this.emit(Bytecode.BIN_OP, Operator.GT);
    this.emit(Bytecode.JMPZ, negative);

    this.emit(Bytecode.LOAD_LOCAL, symbol.index);
    this.decode(ast.max);
    this.emit(Bytecode.BIN_OP, Operator.LT);
    this.emit(Bytecode.JMPZ, end);
    this.emit(Bytecode.JMP, body);

    this.makeLabel(negative);
    this.emit(Bytecode.LOAD_LOCAL, symbol.index);
    this.decode(ast.max);
    this.emit(Bytecode.BIN_OP, Operator.GT);
    this.emit(Bytecode.JMPZ, end);

    this.makeLabel(body);
    this.decode(ast.body);
    this.emit(Bytecode.LOAD_LOCAL, symbol.index);
    this.decode(ast.step);
    this.emit(Bytecode.BIN_OP, Operator.PLUS);
    this.emit(Bytecode.STORE_LOCAL, symbol.index);
    this.emit(Bytecode.JMP, start);

    this.makeLabel(end);
    this.endFrame();
  }

  IfStatement(ast, endLabel = null) {
    const end = endLabel ?? this.generateLabelName();
    let alternate;

    this.decode(ast.test);
    if (ast.alternate !== null) {
      alternate = this.generateLabelName();
      this.emit(Bytecode.JMPZ, alternate);
    } else {
      this.emit(Bytecode.JMPZ, end);
    }

    this.startFrame();
    this.decode(ast.consequent);
    this.endFrame();

    if (ast.alternate !== null) {
      this.emit(Bytecode.JMP, end);
      this.makeLabel(alternate);
      if (ast.alternate.type === 'IfStatement') {
        this.IfStatement(ast.alternate, end);
      } else {
        this.startFrame();
        this.decode(ast.alternate);
        this.endFrame();
      }
    }

    if (endLabel === null) this.makeLabel(end);
  }

  PrintStatement(ast) {
    this.decode(ast.expression);
    if (ast.end === '') this.emit(Bytecode.PRINT);
    else this.emit(Bytecode.PRINTLN);
  }

  Statements(ast) {
    for (const statement of ast.body) {
      this.decode(statement);
    }
  }

  Program(ast) {
    this.labels['START'] = this.pc;
    this.decode(ast.body);
    this.emit(Bytecode.HALT);
  }

  decode(ast) {
    if (!this[ast.type]) {
      throw new Error('Invalid code.');
    }
    return this[ast.type](ast);
  }

  compile(ast) {
    this.output = [];
    this.labels = {};
    this.localsCount = 0;
    this.globals = {};
    this.frames = [];
    this.pc = 0;
    this.labelsCount = 0;
    this.decode(ast);
  }
}
