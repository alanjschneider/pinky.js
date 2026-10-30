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
import { Compiler } from './Compiler.js';
import { printCode, VirtualMachine } from './VirtualMachine.js';

const args = process.argv.slice(2);
const options = {
  source: false,
  ast: false,
  tokens: false,
  compiled: false,
  bytecode: false,
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

if (options.compiled) {
  console.time('Executed in');
  const compiler = new Compiler();
  compiler.compile(ast);

  if (options.bytecode) {
    printCode(compiler.output, compiler.labels);
  }

  const vm = new VirtualMachine();
  vm.execute(compiler.output, compiler.labels);
  console.timeEnd('Executed in');
} else {
  console.time('Executed in');
  const interpreter = new Interpreter();
  interpreter.interpret(ast);
  console.timeEnd('Executed in');
}
