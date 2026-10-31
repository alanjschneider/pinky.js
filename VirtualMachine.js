import { stdout } from 'node:process';
import { Bytecode, Mnemonic } from './Compiler.js';

export class VirtualMachine {
  constructor() {
    this.pc = 0;
    this.sp = 0;
    this.stack = [];
    this.program = [];
    this.labels = {};
    this.globals = {};
  }

  execute(program, labels) {
    this.pc = 0;
    this.sp = 0;
    this.stack = [];
    this.program = program;
    this.labels = labels;
    this.globals = {};

    while (this.pc < this.program.length) {
      this.step();
    }
  }

  stackPop(n = 1) {
    this.sp -= n;
    return this.stack[this.sp];
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

      case Bytecode.POP: {
        const n = this.program[this.pc++];
        this.stackPop(n);
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

      case Bytecode.STORE_LOCAL: {
        const value = this.stackPop();
        const index = this.program[this.pc++];
        if (index > this.sp) this.sp++; // if it is a new local it will be on the top of the stack
        this.stack[index] = value;
        this.stackPush(value);
        break;
      }

      case Bytecode.STORE: {
        const value = this.stackPop();
        const name = this.program[this.pc++];
        this.globals[name] = value;
        break;
      }

      case Bytecode.LOAD_LOCAL: {
        const index = this.program[this.pc++];
        const value = this.stack[index];
        this.stackPush(value);
        break;
      }

      case Bytecode.LOAD: {
        const name = this.program[this.pc++];
        const value = this.globals[name];
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
    const name = Mnemonic[bytecode];

    // prettier-ignore
    switch (bytecode) {
      case Bytecode.BIN_OP:
      case Bytecode.UN_OP:
      case Bytecode.PUSH:
      case Bytecode.POP:
      case Bytecode.JMP:
      case Bytecode.JMPZ:
      case Bytecode.STORE_LOCAL:
      case Bytecode.LOAD_LOCAL:
      case Bytecode.STORE:
      case Bytecode.LOAD:
        console.log(name.padEnd(tab * 1.5, ' ') + '(' + code[pc++] + ')');
        break;

      case Bytecode.HALT:
      case Bytecode.PRINT:
      case Bytecode.PRINTLN:
        console.log(name);
        break;
    }
  }
}
