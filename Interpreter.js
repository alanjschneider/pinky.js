import { Environment } from './Environment.js';
import { ParserError } from './ParserError.js';
import { RuntimeError } from './RuntimeError.js';

const Type = {
  NUMBER: 0,
  STRING: 1,
  BOOL: 2,
  NULL: 3,
};

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

export class Interpreter {
  constructor() {}

  Number(ast) {
    return [Type.NUMBER, ast.value];
  }

  String(ast) {
    return [Type.STRING, ast.value];
  }

  Bool(ast) {
    return [Type.BOOL, ast.value];
  }

  Identifier(ast, env) {
    return env.getVar(ast.name);
  }

  Null(ast) {
    return [Type.NULL, ast.value];
  }

  UnaryExpression(ast, env) {
    const [type, value] = this.interpret(ast.right, env);
    // prettier-ignore
    switch (ast.operator) {
      case '+':
        if (type !== Type.NUMBER) {
          throw new RuntimeError(1, 'Invalid unary opration.')
        }
        return [type, +value];

      case '-':
        if (type !== Type.NUMBER) {
          throw new RuntimeError(1, 'Invalid unary opration.')
        }
        return [type, -value];

      case '~':
        if (type !== Type.NUMBER && type !== Type.BOOL) {
          throw new RuntimeError(1, 'Invalid negation.');
        }
        return [type, !value];
    }
  }

  BinaryExpression(ast, env) {
    const [leftType, leftValue] = this.interpret(ast.left, env);

    // short circuit evaluation
    switch (ast.operator) {
      case 'and': {
        if (leftType !== Type.BOOL) {
          throw new RuntimeError(ast.line, 'Invalid logic operation.');
        }

        if (leftValue !== true) return [Type.BOOL, false];

        const [rightType, rightValue] = this.interpret(ast.right, env);

        if (rightType !== Type.BOOL) {
          throw new RuntimeError(ast.line, 'Invalid logic operation.');
        }

        return [Type.BOOL, leftValue && rightValue];
      }

      case 'or': {
        if (leftType !== Type.BOOL) {
          throw new RuntimeError(ast.line, 'Invalid logic operation.');
        }

        if (leftValue === true) return [Type.BOOL, true];

        const [rightType, rightValue] = this.interpret(ast.right, env);

        if (rightType !== Type.BOOL) {
          throw new RuntimeError(ast.line, 'Invalid logic operation.');
        }

        return [Type.BOOL, leftValue || rightValue];
      }
    }

    const [rightType, rightValue] = this.interpret(ast.right, env);
    // prettier-ignore
    switch (ast.operator) {
      case '+':
        const type = (leftType === Type.STRING || rightType === Type.STRING) ? Type.STRING : Type.NUMBER;
        return [type, (leftType === Type.NULL ? '' : leftValue) + (rightType === Type.NULL ? '' : rightValue)];

      case '-':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid substraction.')
        }
        return [Type.NUMBER, leftValue - rightValue];

      case '*':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid multiplication.')
        }
        return [Type.NUMBER, leftValue * rightValue];

      case '/':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid division.')
        }
        if (rightValue === 0) {
          throw new RuntimeError(ast.line, 'Forbiden division by 0.')
        }
        return [Type.NUMBER, leftValue / rightValue];

      case '^':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid power operation.')
        }
        return [Type.NUMBER, Math.pow(leftValue, rightValue)];

      case '%':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid module operation.')
        }
        return [Type.NUMBER, leftValue % rightValue];

      case '<':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid logic comparison.')
        }
        return [Type.BOOL, leftValue < rightValue];

      case '<=':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid logic comparison.')
        }
        return [Type.BOOL, leftValue <= rightValue];

      case '>':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid logic comparison.')
        }
        return [Type.BOOL, leftValue > rightValue];

      case '>=':
        if (leftType !== Type.NUMBER || rightType !== Type.NUMBER) {
          throw new RuntimeError(ast.line, 'Invalid logic comparison.')
        }
        return [Type.BOOL, leftValue >= rightValue];

      case '==':
        return [Type.BOOL, leftValue === rightValue];

      case '~=':
        return [Type.BOOL, leftValue !== rightValue];
    }
  }

  Parameters(ast, env) {
    const params = [];
    for (const param of ast.values) {
      params.push(this.interpret(param, env));
    }
    return params;
  }

  Arguments(ast, env) {
    const args = [];
    for (const arg of ast.values) {
      args.push(this.interpret(arg, env));
    }
    return args;
  }

  FuncCall(ast, env) {
    if (ast.identifier.type !== 'Identifier') {
      throw new RuntimeError(ast.line, 'Invalid function call.');
    }

    const args = this.interpret(ast.args, env);
    const funcDecl = env.getVar(ast.identifier.name);
    const funcEnv = new Environment(env);
    const params = funcDecl.params.values;

    if (args.length < params.length) {
      throw new RuntimeError(
        ast.line,
        `Function ${ast.identifier.name} expected ${params.length} arguments, only ${args.length} was provided.`,
      );
    }

    for (let i = 0; i < params.length; i++) {
      funcEnv.setVar(params[i].name, args[i]);
    }

    const ret = this.interpret(funcDecl.body, funcEnv);
    if (ret instanceof ReturnSignal) return ret.value;
  }

  FuncDeclaration(ast, env) {
    if (!env.isGlobal) {
      throw new RuntimeError(
        ast.line,
        'Functions should be declared at top-level/global scope.',
      );
    }

    env.setLocalVar(ast.identifier.name, {
      params: ast.params,
      body: ast.body,
    });
  }

  ReturnStatement(ast, env) {
    return new ReturnSignal(this.interpret(ast.expression, env));
  }

  ForStatement(ast, env) {
    const forEnv = new Environment(env);

    this.interpret(ast.start, forEnv);
    let [startType, start] = forEnv.getVar(ast.start.left.name);
    if (startType !== Type.NUMBER) {
      throw new RuntimeError(
        ast.line,
        'Invalid start number in for statement.',
      );
    }

    const [maxType, max] = this.interpret(ast.max, forEnv);
    if (maxType !== Type.NUMBER) {
      throw new RuntimeError(ast.line, 'Invalid max number in for statement.');
    }

    const [stepType, step] = this.interpret(ast.step, forEnv);
    if (stepType !== Type.NUMBER) {
      throw new RuntimeError(ast.line, 'Invalid step number in for statement.');
    }

    if (step === 0) {
      throw new RuntimeError(ast.line, 'Step must be grater than 0.');
    }

    if (start < max) {
      if (step < 0) {
        throw new RuntimeError(ast.line, 'Step must be positive.');
      }
      while (true) {
        if (start >= max) break;

        const ret = this.interpret(ast.body, new Environment(forEnv));
        if (ret) return ret;

        forEnv.setVar(ast.start.left.name, [Type.NUMBER, start + step]);
        start += step;
      }
    } else if (start > max) {
      if (step > 0) {
        throw new RuntimeError(ast.line, 'Step must be negative.');
      }
      while (true) {
        if (start <= max) break;

        const ret = this.interpret(ast.body, new Environment(forEnv));
        if (ret) return ret;

        forEnv.setVar(ast.start.left.name, [Type.NUMBER, start + step]);
        start += step;
      }
    }
  }

  WhileStatement(ast, env) {
    while (true) {
      const [type, test] = this.interpret(ast.test, env);

      if (type !== Type.BOOL) {
        throw new RuntimeError(ast.line, 'Invalid test in while statement.');
      }

      if (!test) break;

      const ret = this.interpret(ast.body, new Environment(env));
      if (ret) return ret;
    }
  }

  IfStatement(ast, env) {
    const [type, test] = this.interpret(ast.test, env);

    if (type !== Type.BOOL) {
      throw new RuntimeError(ast.line, 'Invalid test in if statement.');
    }

    const ifEnv = new Environment(env);
    if (test) {
      const ret = this.interpret(ast.consequent, ifEnv);
      if (ret) return ret;
    } else if (ast.alternate !== null) {
      const ret = this.interpret(ast.alternate, ifEnv);
      if (ret) return ret;
    }
  }

  PrintStatement(ast, env) {
    const [type, value] = this.interpret(ast.expression, env);
    if (type === Type.NULL) process.stdout.write(ast.end);
    else process.stdout.write(value + ast.end);
  }

  AssignStatement(ast, env) {
    if (ast.left.type !== 'Identifier') {
      throw new RuntimeError(ast.line, 'Invalid left-hand side assignment.');
    }

    if (ast.local && env.isGlobal) {
      throw new RuntimeError(
        ast.line,
        'Local variables only be allowed inside a block (if/while/for/func)',
      );
    }

    const expr = this.interpret(ast.right, env);
    if (ast.local) env.setLocalVar(ast.left.name, expr);
    else env.setVar(ast.left.name, expr);
  }

  Statements(ast, env) {
    for (const statement of ast.body) {
      const ret = this.interpret(statement, env);
      if (ret) return ret;
    }
  }

  Program(ast) {
    const globalEnv = new Environment(null);
    return this.interpret(ast.body, globalEnv);
  }

  Undefined(ast) {
    throw new ParserError(ast.line, 'Undefined value.');
  }

  interpret(ast, env) {
    if (!this[ast.type]) {
      throw new Error('Invalid syntax.');
    }
    return this[ast.type](ast, env);
  }
}
