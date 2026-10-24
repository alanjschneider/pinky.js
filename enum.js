function makeEnum(name, values, { start = 1, indent = 2 } = {}) {
  const spaces = ' '.repeat(indent);
  let num = start;
  let str = 'export const ' + name + ' = {\n';

  for (const value of values) {
    if (value === '') {
      str += '\n';
    } else if (value.startsWith('#')) {
      str += spaces + '//' + value.slice(1) + '\n';
    } else {
      str += spaces + value + ': ' + num + ',\n';
      num++;
    }
  }
  return str + '};';
}

// prettier-ignore
const tokens = [
  // 'LSQUAR',   // [
  // 'RSQUAR',   // ]
  'CARET',    // ^
  'COMMA',    // ,
  'LPAREN',   // (
  'DOT',      // .
  'MODULO',   // %
  'MINUS',    // -
  'PLUS',     // +
  'RPAREN',   // (
  'SLASH',    // /
  'STAR',     // *
  '',
  // '# Extended',
  // 'LCURL',    // {
  // 'RCURL',    // }
  // '',
  '# One or two character tokens.',
  'COLON',    // :
  'COLON_EQ', // :=
  'EQ_EQ',    // ==
  'GE',       // >=
  'GT',       // >
  'LE',       // <=
  'LT',       // <
  'TILDE',    // ~
  'TILDE_EQ', // ~=
  '',
  // '# Extended',
  // 'PLUS_EQ',  // +=
  // 'MINUS_EQ', // -=
  // '',
  '# Literals.',
  'NUMBER',
  'IDENTIFIER',
  'STRING',
  '',
  '# Keywords.',
  'AND',
  'DO',
  'ELSE',
  'ELIF',
  'END',
  'FALSE',
  'FUNC',
  'FOR',
  'IF',
  'LOCAL',
  // 'NIL',
  'OR',
  'PRINT',
  'PRINTLN',
  'RET',
  'THEN',
  'TRUE',
  'WHILE',
  '',
  'EOF',
];

// const opCodes = [
//   '# Stack',
//   'PUSH',
//   'POP',
//   '',
//   '# Binary and unary operators',
//   'ADD',
//   'SUB',
//   'MUL',
//   'DIV',
//   'OR',
//   'AND',
//   'NOT',
//   'NEG',
//   'EXP',
//   'MOD',
//   'EQ',
//   'NE',
//   'GT',
//   'GE',
//   'LT',
//   'LE',
//   '',
//   '# Load and store variables',
//   'LOAD',
//   'STORE',
//   'LOAD_LOCAL',
//   'STORE_LOCAL',
//   '',
//   '# Control flow',
//   'LABEL',
//   'JMP',
//   'JMPZ',
//   'JSR',
//   'RTS',
//   'HALT',
//   '',
//   '# Output',
//   'PRINT',
//   'PRINTLN',
// ];

console.log(makeEnum('TokenType', tokens));
// console.log(makeEnum('OpCode', opCodes));
