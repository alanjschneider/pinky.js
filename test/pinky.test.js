import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Lexer } from '../Lexer.js';
import { Parser } from '../Parser.js';
import { Interpreter } from '../Interpreter.js';
import { print } from '../Ast.js';

describe('Functions', () => {
  test('Declare nested function should throw error', () => {
    const lexer = new Lexer();
    const parser = new Parser();
    const interpreter = new Interpreter();

    const source = `
      if true then
        func execute()
            println "Executed"
        end
      end
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    assert.throws(() => {
      interpreter.interpret(ast);
    }, /Functions should be declared at top-level\/global scope\./);
  });
});

describe('Binary and unary expressions', () => {
  const lexer = new Lexer();
  const parser = new Parser();
  const interpreter = new Interpreter();

  test('Add', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      add := 7 + 4
      print add
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '11');
  });

  test('Sub', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      sub := 7 - 4
      print sub
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '3');
  });

  test('Mul', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      mul := 7 * 4
      print mul
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '28');
  });

  test('Div', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      div := 7 / 4
      print div
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '1.75');
  });

  test('Modulo', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      mod := 7 % 4
      print mod
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '3');
  });

  test('Pow', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      pow := 7 ^ 4
      print pow
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '2401');
  });

  test('Less than', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      lt := 7 < 4
      print lt
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'false');
  });

  test('Less eq', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      le := 7 <= 4
      print le
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'false');
  });

  test('Greater than', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      gt := 7 > 4
      print gt
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'true');
  });

  test('Greater eq', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      ge := 7 >= 4
      print ge
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'true');
  });

  test('Eq', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      ge := 7 == 4
      print ge
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'false');
  });

  test('Not eq', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      ne := 7 ~= 4
      print ne
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'true');
  });

  test('And', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      test := false and true
      print test
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'false');
  });

  test('Or', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      test := false or true
      print test
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'true');
  });

  test('Unary +', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      plus := +99
      print plus
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '99');
  });

  test('Unary -', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      plus := -99
      print plus
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '-99');
  });

  test('Unary ~', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      plus := ~true
      print plus
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'false');
  });
});

describe('Complex expressions', () => {
  const lexer = new Lexer();
  const parser = new Parser();
  const interpreter = new Interpreter();

  test('10 * 5 + 33 - 20 / 8 = 80.5', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      expr := 10 * 5 + 33 - 20 / 8
      print expr
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '80.5');
  });

  test('10 * (5 + 33 - 20) / 8 = 22.5', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      expr := 10 * (5 + 33 - 20) / 8
      print expr
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '22.5');
  });

  test('2 ^ 2 ^ 3 = 256', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      expr := 2 ^ 2 ^ 3
      print expr
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '256');
  });

  test('(2 ^ 2) ^ 3 = 64', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      expr := (2 ^ 2) ^ 3
      print expr
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '64');
  });

  test('((17 - -3) * 2 ^ (1 + (-1 + 3))) / 2 = 80', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      expr := ((17 - -3) * 2 ^ (1 + (-1 + 3))) / 2
      print expr
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], '80');
  });
});

describe('Variables', () => {
  const lexer = new Lexer();
  const parser = new Parser();
  const interpreter = new Interpreter();

  test('Primitives', () => {
    const source = `
      score := 5
      name := 'Pinky'
      isrunning := true
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    assert.doesNotThrow(() => {
      interpreter.interpret(ast);
    });
  });

  test('Case sesitive', (t) => {
    const write = t.mock.method(process.stdout, 'write', () => true);

    const source = `
      name := "Pinky"
      NAME := "PINKY"
      print name
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    interpreter.interpret(ast);

    assert.equal(write.mock.callCount(), 1);
    assert.equal(write.mock.calls[0].arguments[0], 'Pinky');
    assert.notEqual(write.mock.calls[0].arguments[0], 'PINKY');
  });

  test('Declare local variable outside of a block (if/while/for/func) should throw error', () => {
    const source = 'local global := true';

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    assert.throws(() => {
      interpreter.interpret(ast);
    });
  });

  test('Declare local variable inside of a block (if/while/for/func) should not throw error', (t) => {
    t.mock.method(process.stdout, 'write', () => true);

    const source = `
      if true then 
        local number := 1
      end

      for i := 0, 5 do
        local msg := "i: " + i
        println msg
      end

      i := 0
      while i < 5 do
        local msg := "i: " + i
        println msg
        i := i + 1
      end

      func add(a, b)
        local res := a + b
        ret res
      end
    `;

    const tokens = lexer.tokenize(source);
    const ast = parser.parse(tokens);

    assert.doesNotThrow(() => {
      interpreter.interpret(ast);
    });
  });
});
