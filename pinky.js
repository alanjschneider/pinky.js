/*
  pinky.js Copyright (C) 2026 alanjschneider
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  any later version.
*/

import { readFile } from 'node:fs/promises';
import { print } from './Ast.js';
import { Lexer } from './Lexer.js';
import { Parser } from './Parser.js';
import { Interpreter } from './Interpreter.js';

const args = process.argv.slice(2);
const options = {
  source: false,
  ast: false,
  tokens: false,
};

let filename;

for (const arg of args) {
  const lower = arg.toLowerCase();
  if (lower.startsWith('--')) {
    const option = lower.slice(2);
    if (option in options) {
      options[option] = true;
    }
  } else {
    filename = lower;
  }
}

const source = await readFile(filename, 'utf-8');
if (options.source) console.log(source);

const lexer = new Lexer();
const tokens = lexer.tokenize(source);
if (options.tokens) console.log(tokens);

const parser = new Parser();
const ast = parser.parse(tokens);
if (options.ast) print(ast);

const interpreter = new Interpreter();
console.time('Executed in');
interpreter.interpret(ast);
console.timeEnd('Executed in');
