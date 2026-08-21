/**
 * A simple arithmetic expression parser that supports:
 * - Basic operations: +, -, *, /
 * - Parentheses for grouping
 * - Integer and decimal numbers
 * - Negative numbers
 */
export class ExpressionParser {
  private expression: string;
  private position: number;

  public parse(expression: string): number {
    if (expression == null || expression.trim().length === 0) {
      throw new Error('Expression cannot be null or empty');
    }

    this.expression = expression.replace(/\s+/g, '');
    this.position = 0;

    const result = this.parseExpression();

    if (this.position < this.expression.length) {
      throw new Error(
        'Unexpected character at position ' +
          this.position +
          ': ' +
          this.expression.charAt(this.position)
      );
    }

    return result;
  }

  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.position < this.expression.length) {
      const operator = this.expression.charAt(this.position);

      if (operator !== '+' && operator !== '-') {
        break;
      }

      this.position++;
      const right = this.parseTerm();

      if (operator === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }

    return left;
  }

  private parseTerm(): number {
    let left = this.parseFactor();

    while (this.position < this.expression.length) {
      const operator = this.expression.charAt(this.position);

      if (operator !== '*' && operator !== '/') {
        break;
      }

      this.position++;
      const right = this.parseFactor();

      if (operator === '*') {
        left = left * right;
      } else {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        left = left / right;
      }
    }

    return left;
  }

  private parseFactor(): number {
    // Handle negative numbers
    let negative = false;
    if (
      this.position < this.expression.length &&
      this.expression.charAt(this.position) === '-'
    ) {
      negative = true;
      this.position++;
    }

    let result: number;

    if (
      this.position < this.expression.length &&
      this.expression.charAt(this.position) === '('
    ) {
      this.position++; // skip '('
      result = this.parseExpression();

      if (
        this.position >= this.expression.length ||
        this.expression.charAt(this.position) !== ')'
      ) {
        throw new Error('Missing closing parenthesis');
      }
      this.position++; // skip ')'
    } else {
      result = this.parseNumber();
    }

    return negative ? -result : result;
  }

  private parseNumber(): number {
    const start = this.position;

    while (
      this.position < this.expression.length &&
      (this.isDigit(this.expression.charAt(this.position)) ||
        this.expression.charAt(this.position) === '.')
    ) {
      this.position++;
    }

    if (start === this.position) {
      throw new Error('Expected number at position ' + this.position);
    }

    const numberStr = this.expression.substring(start, this.position);

    const parsed = parseFloat(numberStr);
    if (isNaN(parsed)) {
      throw new Error('Invalid number format: ' + numberStr);
    }
    return parsed;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
}
