import { stdout } from 'node:process';
import { Bytecode, BytecodeNames } from './Compiler.js';

export class VirtualMachine {
  constructor() {
    this.pc = 0;
    this.sp = 0;
    this.stack = [];
    this.program = [];
    this.labels = {};
    this.variables = {};
  }

  execute(program, labels) {
    this.pc = 0;
    this.sp = 0;
    this.stack = [];
    this.program = program;
    this.labels = labels;
    this.variables = {};

    while (this.pc < this.program.length) {
      this.step();
    }
  }

  stackPop() {
    return this.stack[--this.sp];
  }

  stackPush(value) {
    this.stack[this.sp++] = value;
  }

  stackPeek() {
    return this.stack[this.sp - 1];
  }

  step() {
    const bytecode = this.program[this.pc++];
    switch (bytecode) {
      case Bytecode.PRINT: {
        const value = this.stackPop();
        stdout.write(value);
        break;
      }

      case Bytecode.PRINTLN: {
        const value = this.stackPop();
        stdout.write(value + '\n');
        break;
      }

      case Bytecode.PUSH: {
        const value = this.program[this.pc++];
        this.stackPush(value);
        break;
      }

      case Bytecode.BIN_OP: {
        const op = this.program[this.pc++];
        const right = this.stackPop();
        const left = this.stackPop();
        // prettier-ignore
        switch (op) {
          case '+':   this.stackPush(left + right);   break;
          case '-':   this.stackPush(left - right);   break;
          case '*':   this.stackPush(left * right);   break;
          case '/':
            if (right === 0) throw new Error('Forbidden division by 0.');
            this.stackPush(left / right);
            break;
          case '^':   this.stackPush(Math.pow(left, right)); break;
          case '%':   this.stackPush(left % right);   break;
          case 'and': this.stackPush(left && right);  break;
          case 'or':  this.stackPush(left || right);  break;
          case '<':   this.stackPush(left < right);   break;
          case '<=':  this.stackPush(left <= right);  break;
          case '>':   this.stackPush(left > right);   break;
          case '>=':  this.stackPush(left >= right);  break;
          case '==':  this.stackPush(left === right); break;
          case '~=':  this.stackPush(left !== right); break;
        }
        break;
      }

      case Bytecode.UN_OP: {
        const op = this.program[this.pc++];
        const right = this.stackPop();
        // prettier-ignore
        switch (op) {
          case '+':  this.stackPush(+right); break;
          case '-':  this.stackPush(-right); break;
          case '~':  this.stackPush(!right); break;
        }
        break;
      }

      case Bytecode.JMP: {
        const label = this.program[this.pc++];
        this.pc = this.labels[label];
        break;
      }

      case Bytecode.JMPZ: {
        const value = this.stackPop();
        const label = this.program[this.pc++];
        if (!value) {
          this.pc = this.labels[label];
        }
        break;
      }

      case Bytecode.STORE: {
        const value = this.stackPop();
        const name = this.program[this.pc++];
        this.variables[name] = value;
        break;
      }

      case Bytecode.LOAD: {
        const name = this.program[this.pc++];
        const value = this.variables[name];
        this.stackPush(value);
        break;
      }

      case Bytecode.HALT:
        break;

      default:
        throw new Error('Runtime error.');
    }
  }
}

export function printCode(code, labels) {
  const tab = 10;
  const labelAddr = {};

  for (const label in labels) {
    const addr = labels[label];
    labelAddr[addr] = label;
  }

  let pc = 0;

  while (pc < code.length) {
    if (labelAddr[pc]) stdout.write((labelAddr[pc] + ':').padEnd(tab, ' '));
    else stdout.write(' '.repeat(tab));

    const bytecode = code[pc++];
    const name = BytecodeNames[bytecode];

    // prettier-ignore
    switch (bytecode) {
      case Bytecode.BIN_OP:
      case Bytecode.UN_OP:
      case Bytecode.PUSH:
      case Bytecode.JMP:
      case Bytecode.JMPZ:
      case Bytecode.STORE:
      case Bytecode.LOAD:
        console.log(name.padEnd(tab, ' ') + '(' + code[pc++] + ')');
        break;

      case Bytecode.HALT:
      case Bytecode.PRINT:
      case Bytecode.PRINTLN:
        console.log(name);
        break;
    }
  }
}
