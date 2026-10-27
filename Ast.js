export class Identifier {
  constructor(name, line) {
    this.name = name;
    this.line = line;
    this.type = 'Identifier';
  }
}

export class AssignStatement {
  constructor(left, right, local, line) {
    this.left = left;
    this.right = right;
    this.local = local;
    this.line = line;
    this.type = 'AssignStatement';
  }
}

export class PrintStatement {
  constructor(expression, end, line) {
    this.expression = expression;
    this.end = end;
    this.line = line;
    this.type = 'PrintStatement';
  }
}

export class BinaryExpression {
  constructor(operator, left, right, line) {
    this.operator = operator;
    this.left = left;
    this.right = right;
    this.line = line;
    this.type = 'BinaryExpression';
  }
}

export class String {
  constructor(value, raw, line) {
    this.value = value;
    this.raw = raw;
    this.line = line;
    this.type = 'String';
  }
}

export class Number {
  constructor(value, line) {
    this.value = value;
    this.line = line;
    this.type = 'Number';
  }
}

export class Bool {
  constructor(value, line) {
    this.value = value;
    this.line = line;
    this.type = 'Bool';
  }
}

export class Program {
  constructor(body, line) {
    this.body = body;
    this.line = line;
    this.type = 'Program';
  }
}

export class Parameters {
  constructor(values) {
    this.values = values;
    this.type = 'Parameters';
  }
}

export class Arguments {
  constructor(values) {
    this.values = values;
    this.type = 'Arguments';
  }
}

export class Statements {
  constructor(body) {
    this.body = body;
    this.type = 'Statements';
  }
}

export class FuncDeclaration {
  constructor(identifier, params, body, line) {
    this.identifier = identifier;
    this.params = params;
    this.body = body;
    this.line = line;
    this.type = 'FuncDeclaration';
  }
}

export class FuncCall {
  constructor(identifier, args, line) {
    this.identifier = identifier;
    this.args = args;
    this.line = line;
    this.type = 'FuncCall';
  }
}

export class WhileStatement {
  constructor(test, body, line) {
    this.test = test;
    this.body = body;
    this.line = line;
    this.type = 'WhileStatement';
  }
}

export class ForStatement {
  constructor(start, max, step, body, line) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.body = body;
    this.line = line;
    this.type = 'ForStatement';
  }
}

export class ReturnStatement {
  constructor(expression, line) {
    this.expression = expression;
    this.line = line;
    this.type = 'ReturnStatement';
  }
}

export class IfStatement {
  constructor(test, consequent, alternate, line) {
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
    this.line = line;
    this.type = 'IfStatement';
  }
}

export class UnaryExpression {
  constructor(operator, right, line) {
    this.operator = operator;
    this.right = right;
    this.line = line;
    this.type = 'UnaryExpression';
  }
}

// For internal use only. Pinky doesn't allow explicit nulls.
// Used by RetStatement and PrintStatement so they can be used
// without an expression.
export class Null {
  constructor(line) {
    this.line = line;
    this.value = null;
    this.type = 'Null';
  }
}

export function print(ast, depth = 0) {
  const indent = ' '.repeat(depth * 2);

  switch (ast.type) {
    case 'Number':
      console.log(indent + 'Number: ' + ast.value);
      break;
    case 'Bool':
      console.log(indent + 'Bool: ' + ast.value);
      break;
    case 'String':
      console.log(indent + 'String: ' + ast.raw);
      break;
    case 'Identifier':
      console.log(indent + 'Identifier: ' + ast.name);
      break;
    case 'Null':
      console.log(indent + 'Null');
      break;
    case 'PrintStatement':
      console.log(indent + 'Print:');
      print(ast.expression, depth + 1);
      console.log(indent + '  end=' + (ast.end === '\n' ? '"\\n"' : '""'));
      break;
    case 'ReturnStatement':
      console.log(indent + 'Return:');
      print(ast.expression, depth + 1);
      break;
    case 'Parameters':
      console.log(indent + 'Parameters: (' + (ast.values.length ? '' : ')'));
      for (const value of ast.values) {
        print(value, depth + 1);
      }
      if (ast.values.length) console.log(indent + ')');
      break;
    case 'Arguments':
      console.log(indent + 'Arguments: (' + (ast.values.length ? '' : ')'));
      for (const value of ast.values) {
        print(value, depth + 1);
      }
      if (ast.values.length) console.log(indent + ')');
      break;
    case 'FuncDeclaration':
      console.log(indent + 'FuncDeclaration: ' + ast.identifier.name);
      print(ast.params, depth + 1);
      print(ast.body, depth + 1);
      break;
    case 'FuncCall':
      console.log(indent + 'FuncCall');
      print(ast.identifier, depth + 1);
      print(ast.args, depth + 1);
      break;
    case 'WhileStatement':
      console.log(indent + 'WhileStatement:');
      print(ast.test, depth + 1);
      console.log(indent + '  do');
      print(ast.body, depth + 1);
      break;
    case 'ForStatement':
      console.log(indent + 'ForStatement:');
      print(ast.start, depth + 1);
      print(ast.max, depth + 1);
      print(ast.step, depth + 1);
      console.log(indent + '  do');
      print(ast.body, depth + 1);
      break;
    case 'BinaryExpression':
      console.log(indent + 'BinaryExpression:');
      print(ast.left, depth + 1);
      console.log(indent + '  ' + ast.operator);
      print(ast.right, depth + 1);
      break;
    case 'UnaryExpression':
      console.log(indent + 'UnaryExpression:');
      console.log(indent + '  ' + ast.operator);
      print(ast.right, depth + 1);
      break;
    case 'AssignStatement':
      console.log(indent + 'AssignStatement: ' + (ast.local ? 'local' : ''));
      print(ast.left, depth + 1);
      console.log(indent + '  :=');
      print(ast.right, depth + 1);
      break;
    case 'IfStatement':
      console.log(indent + 'IfStatement:');
      print(ast.test, depth + 1);
      print(ast.consequent, depth + 1);
      if (ast.alternate?.type === 'Statements') {
        console.log(indent + 'Else:');
        print(ast.alternate, depth + 1);
      } else if (ast.alternate !== null) {
        print(ast.alternate, depth + 1);
      }
      break;
    case 'Statements':
      for (const statement of ast.body) {
        print(statement, depth + 1);
      }
      break;
    case 'Program':
      console.log(indent + 'Program');
      print(ast.body, depth);
      break;
    case 'ExpressionStatement':
      console.log(indent + 'ExpressionStatement:');
      print(ast.expression, depth + 1);
      break;
  }
}
