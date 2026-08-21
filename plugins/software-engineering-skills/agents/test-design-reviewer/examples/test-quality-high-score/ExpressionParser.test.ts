import { describe, it, expect } from 'vitest';
import { ExpressionParser } from './ExpressionParser';

/**
 * Tests for ExpressionParser following Dave Farley's testing principles.
 *
 * Each test:
 * - Has a descriptive name that documents behavior
 * - Tests exactly one thing
 * - Is independent and isolated
 * - Runs fast without external dependencies
 */
describe('Expression Parser', () => {
  // =========================================================================
  // SINGLE NUMBER PARSING
  // =========================================================================

  describe('when parsing a single number', () => {
    it('returns the integer value', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('42');

      expect(result).toBe(42.0);
    });

    it('returns the decimal value', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('3.14');

      expect(result).toBeCloseTo(3.14, 3);
    });

    it('handles negative integers', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('-7');

      expect(result).toBe(-7.0);
    });

    it('handles negative decimals', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('-2.5');

      expect(result).toBeCloseTo(-2.5, 3);
    });
  });

  // =========================================================================
  // ADDITION
  // =========================================================================

  describe('when adding numbers', () => {
    it('adds two positive integers', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('3+5');

      expect(result).toBe(8.0);
    });

    it('adds multiple numbers left to right', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('1+2+3+4');

      expect(result).toBe(10.0);
    });

    it('adds decimal numbers', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('1.5+2.5');

      expect(result).toBeCloseTo(4.0, 3);
    });
  });

  // =========================================================================
  // SUBTRACTION
  // =========================================================================

  describe('when subtracting numbers', () => {
    it('subtracts second number from first', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('10-3');

      expect(result).toBe(7.0);
    });

    it('can produce negative results', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('3-10');

      expect(result).toBe(-7.0);
    });

    it('chains subtractions left to right', () => {
      const parser = new ExpressionParser();

      // 10 - 3 - 2 = 7 - 2 = 5 (not 10 - 1 = 9)
      const result = parser.parse('10-3-2');

      expect(result).toBe(5.0);
    });
  });

  // =========================================================================
  // MULTIPLICATION
  // =========================================================================

  describe('when multiplying numbers', () => {
    it('multiplies two positive integers', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('6*7');

      expect(result).toBe(42.0);
    });

    it('multiplying by zero returns zero', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('999*0');

      expect(result).toBe(0.0);
    });

    it('multiplies decimal numbers', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('2.5*4');

      expect(result).toBeCloseTo(10.0, 3);
    });
  });

  // =========================================================================
  // DIVISION
  // =========================================================================

  describe('when dividing numbers', () => {
    it('divides first number by second', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('20/4');

      expect(result).toBe(5.0);
    });

    it('returns decimal when division is not exact', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('7/2');

      expect(result).toBeCloseTo(3.5, 3);
    });

    it('throws Error when dividing by zero', () => {
      const parser = new ExpressionParser();

      expect(() => parser.parse('5/0')).toThrow('Division by zero');
    });
  });

  // =========================================================================
  // OPERATOR PRECEDENCE
  // =========================================================================

  describe('operator precedence', () => {
    it('multiplication has higher precedence than addition', () => {
      const parser = new ExpressionParser();

      // 2 + 3 * 4 = 2 + 12 = 14 (not 5 * 4 = 20)
      const result = parser.parse('2+3*4');

      expect(result).toBe(14.0);
    });

    it('division has higher precedence than subtraction', () => {
      const parser = new ExpressionParser();

      // 10 - 6 / 2 = 10 - 3 = 7 (not 4 / 2 = 2)
      const result = parser.parse('10-6/2');

      expect(result).toBe(7.0);
    });

    it('multiplication and division have equal precedence, evaluated left to right', () => {
      const parser = new ExpressionParser();

      // 12 / 3 * 2 = 4 * 2 = 8 (not 12 / 6 = 2)
      const result = parser.parse('12/3*2');

      expect(result).toBe(8.0);
    });

    it('addition and subtraction have equal precedence, evaluated left to right', () => {
      const parser = new ExpressionParser();

      // 10 - 5 + 3 = 5 + 3 = 8 (not 10 - 8 = 2)
      const result = parser.parse('10-5+3');

      expect(result).toBe(8.0);
    });
  });

  // =========================================================================
  // PARENTHESES
  // =========================================================================

  describe('parentheses', () => {
    it('override normal precedence', () => {
      const parser = new ExpressionParser();

      // (2 + 3) * 4 = 5 * 4 = 20
      const result = parser.parse('(2+3)*4');

      expect(result).toBe(20.0);
    });

    it('can be nested', () => {
      const parser = new ExpressionParser();

      // ((1 + 2) * (3 + 4)) = (3 * 7) = 21
      const result = parser.parse('((1+2)*(3+4))');

      expect(result).toBe(21.0);
    });

    it('can contain complex expressions', () => {
      const parser = new ExpressionParser();

      // (10 - 4 / 2) * 3 = (10 - 2) * 3 = 8 * 3 = 24
      const result = parser.parse('(10-4/2)*3');

      expect(result).toBe(24.0);
    });

    it('missing closing parenthesis throws exception', () => {
      const parser = new ExpressionParser();

      expect(() => parser.parse('(1+2')).toThrow(/parenthesis/);
    });
  });

  // =========================================================================
  // WHITESPACE HANDLING
  // =========================================================================

  describe('whitespace handling', () => {
    it('ignores spaces between tokens', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('  2  +  3  ');

      expect(result).toBe(5.0);
    });

    it('ignores tabs between tokens', () => {
      const parser = new ExpressionParser();

      const result = parser.parse('2\t*\t3');

      expect(result).toBe(6.0);
    });
  });

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  describe('error handling', () => {
    it.each([
      [null, 'null'],
      ['', 'empty string'],
      ['   ', 'spaces only'],
      ['\t', 'tab only'],
      ['\n', 'newline only'],
    ])('rejects %s (%s)', (input: string | null) => {
      const parser = new ExpressionParser();

      expect(() => parser.parse(input as string)).toThrow();
    });

    it('rejects expressions with trailing operator', () => {
      const parser = new ExpressionParser();

      expect(() => parser.parse('5+')).toThrow();
    });

    it('rejects expressions with leading operator (except minus)', () => {
      const parser = new ExpressionParser();

      expect(() => parser.parse('+5')).toThrow();
    });

    it('rejects invalid characters', () => {
      const parser = new ExpressionParser();

      expect(() => parser.parse('2+a')).toThrow();
    });
  });

  // =========================================================================
  // COMPLEX EXPRESSIONS (Integration Tests)
  // =========================================================================

  describe('complex expressions', () => {
    it.each([
      ['1+2*3-4/2', 5.0],
      ['(1+2)*(3-1)', 6.0],
      ['10/2+3*4-5', 12.0],
      ['((2+3)*4-10)/2', 5.0],
      ['-5+10', 5.0],
      ['(-5)*(-2)', 10.0],
    ])('evaluates %s = %s', (expression: string, expected: number) => {
      const parser = new ExpressionParser();

      const result = parser.parse(expression);

      expect(result).toBeCloseTo(expected, 3);
    });
  });
});
