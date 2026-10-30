const Type = {
  NUMBER: 0,
  STRING: 1,
  BOOL: 2,
  NULL: 3,
  AUTO: 4,
};

export const Bytecode = {
  PUSH: 0, // push value to the stack
  BIN_OP: 1,
  UN_OP: 2,
  PRINT: 3,
  PRINTLN: 4,
  JMP: 5, // jump to label unconditionally
  JMPZ: 6, // jump to label if the value on top of stack is zero
  LOAD: 7, // search in frame and push to stack
  STORE: 8, // pop from stack and store in frame
  HALT: 9,
};

export const BytecodeNames = Object.keys(Bytecode);

export class Compiler {
  constructor() {
    this.output = [];
    this.labels = {};
    this.pc = 0;
    this.labelCount = 0;
  }

  emit(...args) {
    this.pc += args.length;
    this.output.push(...args);
  }

  makeLabel(label) {
    this.labels[label] = this.pc;
  }

  generateLabelName() {
    return 'L' + this.labelCount++;
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
    this.emit(Bytecode.LOAD, ast.name);
    return Type.AUTO;
  }

  UnaryExpression(ast) {
    const rightType = this.compile(ast.right);
    this.emit(Bytecode.UN_OP);
    switch (ast.operator) {
      case '+':
      case '-':
        if (rightType !== Type.NUMBER) {
          throw new Error('Invalid unary operation.');
        }
        this.emit(ast.operator);
        return Type.NUMBER;
      case '~':
        if (rightType !== Type.BOOL) {
          throw new Error('Invalid unary operation.');
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
            throw new Error('Invalid aritmetic operation.');
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
          throw new Error('Invalid aritmetic operation.');
        }

        this.emit(ast.operator);
        return Type.NUMBER;

      case 'and':
      case 'or':
        if (leftType !== Type.BOOL || rightType !== Type.BOOL) {
          throw new Error('Invalid boolean operation.');
        }

        this.emit(ast.operator);
        return Type.BOOL;

      case '<':
      case '<=':
      case '>':
      case '>=':
        if (leftType !== Type.AUTO && rightType !== Type.AUTO) {
          if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
            throw new Error('Invalid logic comparison.');
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

  AssignStatement(ast) {
    this.compile(ast.right);
    this.emit(Bytecode.STORE, ast.left.name);
  }

  WhileStatement(ast) {
    const end = this.generateLabelName();
    const start = this.generateLabelName();
    this.makeLabel(start);
    this.compile(ast.test);
    this.emit(Bytecode.JMPZ, end);
    this.compile(ast.body);
    this.emit(Bytecode.JMP, start);
    this.makeLabel(end);
  }

  IfStatement(ast, endLabel = null) {
    const end = endLabel ?? this.generateLabelName();
    const alternate = this.generateLabelName();

    this.compile(ast.test);
    if (ast.alternate !== null) this.emit(Bytecode.JMPZ, alternate);
    else this.emit(Bytecode.JMPZ, end);

    this.compile(ast.consequent);

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
      throw new Error('Unsupported Ast node.');
    }
    return this[ast.type](ast);
  }
}
