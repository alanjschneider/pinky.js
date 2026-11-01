import { stdout } from 'node:process';
import { Bytecode, Mnemonic, Operator } from './Compiler.js';

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

  PRINT() {
    stdout.write(this.stackPop());
  }

  PRINTLN() {
    const value = this.stackPop();
    stdout.write(value + '\n');
  }

  PUSH() {
    const value = this.program[this.pc++];
    this.stackPush(value);
  }

  POP() {
    const n = this.program[this.pc++];
    this.stackPop(n);
  }

  BINOP() {
    const op = this.program[this.pc++];
    const right = this.stackPop();
    const left = this.stackPop();
    // prettier-ignore
    switch (op) {
      case Operator.PLUS:  this.stackPush(left + right);   break;
      case Operator.MINUS: this.stackPush(left - right);   break;
      case Operator.STAR:  this.stackPush(left * right);   break;
      case Operator.SLASH:
        if (right === 0) throw new Error('Forbidden division by 0.');
        this.stackPush(left / right);
        break;
      case Operator.CARET:    this.stackPush(Math.pow(left, right)); break;
      case Operator.MODULO:   this.stackPush(left % right);   break;
      case Operator.AND:      this.stackPush(left && right);  break;
      case Operator.OR:       this.stackPush(left || right);  break;
      case Operator.LT:       this.stackPush(left < right);   break;
      case Operator.LE:       this.stackPush(left <= right);  break;
      case Operator.GT:       this.stackPush(left > right);   break;
      case Operator.GE:       this.stackPush(left >= right);  break;
      case Operator.EQEQ:     this.stackPush(left === right); break;
      case Operator.TILDE_EQ: this.stackPush(left !== right); break;
    }
  }

  UNOP() {
    const op = this.program[this.pc++];
    const right = this.stackPop();
    // prettier-ignore
    switch (op) {
      case Operator.PLUS:  this.stackPush(+right); break;
      case Operator.MINUS:  this.stackPush(-right); break;
      case Operator.TILDE:  this.stackPush(!right); break;
    }
  }

  JMP() {
    const label = this.program[this.pc++];
    this.pc = this.labels[label];
  }

  JMPZ() {
    const value = this.stackPop();
    const label = this.program[this.pc++];
    if (!value) {
      this.pc = this.labels[label];
    }
  }

  STORELOCAL() {
    const value = this.stackPop();
    const index = this.program[this.pc++];
    if (index > this.sp) this.sp++; // if it is a new local it will be on the top of the stack
    this.stack[index] = value;
    this.stackPush(value);
  }

  STORE() {
    const value = this.stackPop();
    const name = this.program[this.pc++];
    this.globals[name] = value;
  }

  LOADLOCAL() {
    const index = this.program[this.pc++];
    const value = this.stack[index];
    this.stackPush(value);
  }

  LOAD() {
    const name = this.program[this.pc++];
    const value = this.globals[name];
    this.stackPush(value);
  }

  // asdasd

  step() {
    const bytecode = this.program[this.pc++];
    // prettier-ignore
    switch (bytecode) {
      case Bytecode.PRINT:       this.PRINT();      break;
      case Bytecode.PRINTLN:     this.PRINTLN();    break;
      case Bytecode.PUSH:        this.PUSH();       break;
      case Bytecode.POP:         this.POP();        break;
      case Bytecode.BIN_OP:      this.BINOP();      break;
      case Bytecode.UN_OP:       this.UNOP();       break;
      case Bytecode.JMP:         this.JMP();        break;
      case Bytecode.JMPZ:        this.JMPZ();       break;
      case Bytecode.STORE_LOCAL: this.STORELOCAL(); break;
      case Bytecode.STORE:       this.STORE();      break;
      case Bytecode.LOAD_LOCAL:  this.LOADLOCAL();  break;
      case Bytecode.LOAD:        this.LOAD();       break;
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
