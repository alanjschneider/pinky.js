// prettier-ignore
export const TokenType = {
  CARET: 1,
  COMMA: 2,
  LPAREN: 3,
  DOT: 4,
  MODULO: 5,
  MINUS: 6,
  PLUS: 7,
  RPAREN: 8,
  SLASH: 9,
  STAR: 10,

  // One or two character tokens.
  COLON: 11,
  COLON_EQ: 12,
  EQ_EQ: 13,
  GE: 14,
  GT: 15,
  LE: 16,
  LT: 17,
  TILDE: 18,
  TILDE_EQ: 19,

  // Literals.
  NUMBER: 20,
  IDENTIFIER: 21,
  STRING: 22,

  // Keywords.
  AND: 23,
  DO: 24,
  ELSE: 25,
  ELIF: 26,
  END: 27,
  FALSE: 28,
  FUNC: 29,
  FOR: 30,
  IF: 31,
  LOCAL: 32,
  OR: 33,
  PRINT: 34,
  PRINTLN: 35,
  RET: 36,
  THEN: 37,
  TRUE: 38,
  WHILE: 39,

  EOF: 40,
};

// prettier-ignore
export const Lexeme = [
  '',
  '^',          // CARET: 1,
  ',',          // COMMA: 2,
  '(',          // LPAREN: 3,
  '.',          // DOT: 4,
  '%',          // MODULO: 5,
  '-',          // MINUS: 6,
  '+',          // PLUS: 7,
  ')',          // RPAREN: 8,
  '/',          // SLASH: 9,
  '*',          // STAR: 10,
  ':',          // COLON: 11,
  ':=',         // COLON_EQ: 12,
  '==',         // EQ_EQ: 13,
  '>=',         // GE: 14,
  '>',          // GT: 15,
  '<=',         // LE: 16,
  '<',          // LT: 17,
  '~',          // TILDE: 18,
  '~=',         // TILDE_EQ: 19,
  'number',     // NUMBER: 20,
  'identifier', // IDENTIFIER: 21,
  'string',     // STRING: 22,
  'and',        // AND: 23,
  'do',         // DO: 24,
  'else',       // ELSE: 25,
  'elif',       // ELIF: 26,
  'end',        // END: 27,
  'false',      // FALSE: 28,
  'func',       // FUNC: 29,
  'for',        // FOR: 30,
  'if',         // IF: 31,
  'local',      // LOCAL: 32,
  'or',         // OR: 33,
  'print',      // PRINT: 34,
  'println',    // PRINTLN: 35,
  'ret',        // RET: 36,
  'then',       // THEN: 37,
  'true',       // TRUE: 38,
  'while',      // WHILE: 39,
  'EOF',        // EOF: 40,
];

export const keywords = new Map([
  ['and', TokenType.AND],
  ['do', TokenType.DO],
  ['else', TokenType.ELSE],
  ['elif', TokenType.ELIF],
  ['end', TokenType.END],
  ['false', TokenType.FALSE],
  ['func', TokenType.FUNC],
  ['for', TokenType.FOR],
  ['if', TokenType.IF],
  ['local', TokenType.LOCAL],
  ['or', TokenType.OR],
  ['print', TokenType.PRINT],
  ['println', TokenType.PRINTLN],
  ['ret', TokenType.RET],
  ['then', TokenType.THEN],
  ['true', TokenType.TRUE],
  ['while', TokenType.WHILE],
]);

export class Token {
  constructor(type, lexeme, line) {
    this.type = type;
    this.lexeme = lexeme;
    this.line = line;
  }
}
