import { Lexeme, TokenType } from './Token.js';
import {
  Identifier,
  AssignStatement,
  Program,
  BinaryExpression,
  UnaryExpression,
  String,
  Parameters,
  FuncDeclaration,
  WhileStatement,
  ReturnStatement,
  Bool,
  Statements,
  Arguments,
  FuncCall,
  PrintStatement,
  ForStatement,
  IfStatement,
  Number,
  Null,
} from './Ast.js';
import { ParserError } from './ParserError.js';

export class Parser {
  constructor() {
    this.current = 0;
    this.tokens = null;
  }

  peek() {
    return this.tokens[this.current];
  }

  prevToken() {
    return this.tokens[this.current - 1];
  }

  nextToken() {
    return this.tokens[this.current + 1];
  }

  advance() {
    return this.tokens[this.current++];
  }

  isAtEnd() {
    if (this.peek().type === TokenType.EOF) return true;
    return this.current >= this.tokens;
  }

  match(type) {
    if (this.peek().type !== type) return false;
    this.advance();
    return true;
  }

  matchAny(...types) {
    for (const type of types) {
      if (this.peek().type === type) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  optionalExpr() {
    try {
      return this.expr();
    } catch {}
    return new Null();
  }

  expect(type) {
    if (this.peek().type === type) return this.advance();

    const message = `Expected ${Lexeme[type]}, found ${Lexeme[this.peek().type]}.`;
    throw new ParserError(this.prevToken().line, message);
  }

  primary() {
    const line = this.peek().line;

    if (this.match(TokenType.NUMBER)) {
      const value = this.prevToken().lexeme;
      return new Number(parseFloat(value), line);
    } else if (this.match(TokenType.TRUE)) {
      return new Bool(true, line);
    } else if (this.match(TokenType.FALSE)) {
      return new Bool(false, line);
    } else if (this.match(TokenType.STRING)) {
      const raw = this.prevToken().lexeme;
      const value = raw
        .slice(1, raw.length - 1)
        .replace('\\n', '\n')
        .replace('\\t', '\t');
      return new String(value, raw, line);
    } else if (this.match(TokenType.IDENTIFIER)) {
      const name = this.prevToken().lexeme;
      return new Identifier(name, line);
    } else if (this.match(TokenType.LPAREN)) {
      const expr = this.expr();
      this.expect(TokenType.RPAREN);
      return expr;
    } else {
      throw new ParserError(line, 'Invalid syntax.');
    }
  }

  params() {
    const line = this.peek().line;
    this.expect(TokenType.LPAREN);

    const values = [];

    if (!this.match(TokenType.RPAREN)) {
      do {
        const identifier = this.expect(TokenType.IDENTIFIER);
        if (values.some((p) => p.name === identifier.lexeme)) {
          throw new ParserError(
            line,
            `Duplicated parameter ${identifier.lexeme}.`,
          );
        }
        values.push(new Identifier(identifier.lexeme));
      } while (this.match(TokenType.COMMA));

      this.expect(TokenType.RPAREN);
    }

    return new Parameters(values);
  }

  args() {
    this.expect(TokenType.LPAREN);

    const values = [];

    if (!this.match(TokenType.RPAREN)) {
      do {
        const value = this.expr();
        values.push(value);
      } while (this.match(TokenType.COMMA));

      this.expect(TokenType.RPAREN);
    }

    return new Arguments(values);
  }

  postfix() {
    const line = this.peek().line;
    let left = this.primary();

    while (this.peek().type === TokenType.LPAREN) {
      const args = this.args();
      left = new FuncCall(left, args, line);
    }

    return left;
  }

  exponent() {
    const line = this.peek().line;

    let left = this.postfix();
    if (this.match(TokenType.CARET)) {
      const op = this.prevToken().lexeme;
      const right = this.exponent();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  unary() {
    const line = this.peek().line;

    if (this.matchAny(TokenType.PLUS, TokenType.MINUS, TokenType.TILDE)) {
      const op = this.prevToken().lexeme;
      const right = this.unary();
      return new UnaryExpression(op, right, line);
    }
    return this.exponent();
  }

  modulo() {
    const line = this.peek().line;

    let left = this.unary();
    while (this.match(TokenType.MODULO)) {
      const op = this.prevToken().lexeme;
      const right = this.unary();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  mult() {
    const line = this.peek().line;

    let left = this.modulo();
    while (this.matchAny(TokenType.STAR, TokenType.SLASH)) {
      const op = this.prevToken().lexeme;
      const right = this.modulo();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  addition() {
    const line = this.peek().line;

    let left = this.mult();
    while (this.matchAny(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.prevToken().lexeme;
      const right = this.mult();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  comp() {
    const line = this.peek().line;

    let left = this.addition();
    while (
      this.matchAny(TokenType.LT, TokenType.LE, TokenType.GT, TokenType.GE)
    ) {
      const op = this.prevToken().lexeme;
      const right = this.addition();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  eq() {
    const line = this.peek().line;

    let left = this.comp();
    while (this.matchAny(TokenType.EQ_EQ, TokenType.TILDE_EQ)) {
      const op = this.prevToken().lexeme;
      const right = this.comp();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  and() {
    const line = this.peek().line;

    let left = this.eq();
    while (this.match(TokenType.AND)) {
      const op = this.prevToken().lexeme;
      const right = this.eq();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  or() {
    const line = this.peek().line;

    let left = this.and();
    while (this.match(TokenType.OR)) {
      const op = this.prevToken().lexeme;
      const right = this.and();
      left = new BinaryExpression(op, left, right, line);
    }
    return left;
  }

  assignment(local = false) {
    const line = this.peek().line;

    let left = this.or();
    while (this.matchAny(TokenType.COLON_EQ)) {
      const right = this.assignment();
      left = new AssignStatement(left, right, local, line);
    }
    return left;
  }

  expr() {
    return this.assignment();
  }

  func() {
    const line = this.peek().line;

    const identifier = this.expect(TokenType.IDENTIFIER);
    const params = this.params();
    const body = this.stmts();
    this.expect(TokenType.END);

    return new FuncDeclaration(
      new Identifier(identifier.lexeme),
      params,
      body,
      line,
    );
  }

  while() {
    const line = this.peek().line;

    const test = this.expr();
    this.expect(TokenType.DO);
    const body = this.stmts();
    this.expect(TokenType.END);

    return new WhileStatement(test, body, line);
  }

  return() {
    const line = this.peek().line;
    return new ReturnStatement(this.optionalExpr(), line);
  }

  printStmt(end = '') {
    const line = this.peek().line;

    const expr = this.optionalExpr();
    return new PrintStatement(expr, end, line);
  }

  ifStmt() {
    const line = this.peek().line;

    const test = this.expr();
    this.expect(TokenType.THEN);
    const consequent = this.stmts();
    let alternate = null;
    if (this.match(TokenType.ELIF)) {
      alternate = this.ifStmt();
    } else if (this.match(TokenType.ELSE)) {
      alternate = this.stmts();
      this.expect(TokenType.END);
    } else {
      this.expect(TokenType.END);
    }
    return new IfStatement(test, consequent, alternate, line);
  }

  forStmt() {
    const line = this.peek().line;

    const start = this.assignment(true);
    this.expect(TokenType.COMMA);
    const max = this.expr();
    const step = this.match(TokenType.COMMA) ? this.expr() : new Number(1.0);
    this.expect(TokenType.DO);
    const body = this.stmts();
    this.expect(TokenType.END);
    return new ForStatement(start, max, step, body, line);
  }

  stmt() {
    if (this.match(TokenType.FOR)) {
      return this.forStmt();
    } else if (this.match(TokenType.IF)) {
      return this.ifStmt();
    } else if (this.match(TokenType.PRINT)) {
      return this.printStmt();
    } else if (this.match(TokenType.PRINTLN)) {
      return this.printStmt('\n');
    } else if (this.match(TokenType.RET)) {
      return this.return();
    } else if (this.match(TokenType.WHILE)) {
      return this.while();
    } else if (this.match(TokenType.FUNC)) {
      return this.func();
    } else if (this.match(TokenType.LOCAL)) {
      return this.assignment(true);
    } else {
      return this.expr();
    }
  }

  stmts() {
    const statements = [];
    while (!this.isAtEnd() && this.peek().type !== TokenType.END) {
      statements.push(this.stmt());
    }
    return new Statements(statements);
  }

  program() {
    return new Program(this.stmts());
  }

  parse(tokens) {
    this.tokens = tokens;
    this.current = 0;

    return this.program();
  }
}
