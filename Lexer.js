import { Token, TokenType, keywords } from './Token.js';
import { LexerError } from './LexerError.js';

export class Lexer {
  constructor() {
    this.current = 0;
    this.source = null;
    this.start = 0;
    this.tokens = [];
    this.line = 1;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  advance() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current++];
  }

  match(lexeme) {
    if (this.peek() !== lexeme) return false;
    this.advance();
    return true;
  }

  addToken(type) {
    const lexeme = this.source.slice(this.start, this.current);
    this.tokens.push(new Token(type, lexeme, this.line));
  }

  isDigit(char) {
    return /[0-9]/.test(char);
  }

  isAlpha(char) {
    return /[A-Za-z_]/.test(char);
  }

  isAlphanum(char) {
    return /[A-Za-z0-9_]/.test(char);
  }

  handleIdentifier() {
    while (this.isAlphanum(this.peek())) this.advance();
    const token = this.source.slice(this.start, this.current);
    if (keywords.has(token)) {
      this.addToken(keywords.get(token));
    } else {
      this.addToken(TokenType.IDENTIFIER);
    }
  }

  handleNumber() {
    while (this.isDigit(this.peek())) this.advance();
    if (this.match('.') && this.isDigit(this.peek())) {
      while (this.isDigit(this.peek())) this.advance();
    }
    this.addToken(TokenType.NUMBER);
  }

  handleString(close) {
    while (!this.match(close)) {
      this.advance();
      if (this.isAtEnd()) {
        throw new LexerError(this.line, 'Unclosed string.');
      }
    }

    this.addToken(TokenType.STRING);
  }

  tokenize(source) {
    this.current = 0;
    this.source = source;
    this.tokens = [];

    while (!this.isAtEnd()) {
      this.start = this.current;
      const char = this.advance();

      // prettier-ignore
      switch (char) {
        // single tokens
        case '(': this.addToken(TokenType.LPAREN); break;
        case ')': this.addToken(TokenType.RPAREN); break;
        case '^': this.addToken(TokenType.CARET);  break;
        case ',': this.addToken(TokenType.COMMA);  break;
        case '%': this.addToken(TokenType.MODULO); break;
        case '+': this.addToken(TokenType.PLUS);   break;
        case '/': this.addToken(TokenType.SLASH);  break;
        case '*': this.addToken(TokenType.STAR);   break;
        case '\n': this.line++;                    break;

        // single or double tokens
        case '~': this.addToken(this.match('=') ? TokenType.TILDE_EQ : TokenType.TILDE); break;
        case ':': this.addToken(this.match('=') ? TokenType.COLON_EQ : TokenType.COLON); break;
        case '>': this.addToken(this.match('=') ? TokenType.GE : TokenType.GT);          break;
        case '<': this.addToken(this.match('=') ? TokenType.LE : TokenType.LT);          break;
        case '=': if (this.match('=')) this.addToken(TokenType.EQ_EQ);                   break;

        // comments
        case '-':
          if (this.match('-')) {
            while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
          } else {
            this.addToken(TokenType.MINUS);
          }
          break;

        // strings
        case '"': case "'": this.handleString(char); break;
        // ignore spaces
        case ' ': case '\t': case '\r':   break;

        default:
          if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek()))) {
            this.handleNumber(char);
          } else if (this.isAlpha(char) || char === '_') {
            this.handleIdentifier();
          } else {
            throw new LexerError(this.line, 'Unexpected token: ' + char);
          }
      }
    }

    this.tokens.push(new Token(TokenType.EOF, '\0', this.line));

    return this.tokens;
  }
}
