import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import { ExpressionParser } from './ExpressionParser';

/**
 * Tests for ExpressionParser
 *
 * WARNING: These tests demonstrate POOR test design practices.
 * They are intentionally written to violate Farley's testing principles
 * and serve as an example of what NOT to do.
 */

// Shared mutable state - violates Atomic principle
let parser: ExpressionParser;
const testLog: string[] = [];
let testCounter = 0;
let lastResult: number;

// External dependency - violates Repeatable principle
const LOG_FILE = `/tmp/test_log_${Date.now()}.txt`;

beforeAll(() => {
  parser = new ExpressionParser();
  testLog.length = 0;
  testCounter = 0;

  // Write to external file - violates Repeatable
  fs.writeFileSync(LOG_FILE, `Test run started at: ${new Date()}\n`);
});

afterAll(() => {
  // Cleanup that might fail - violates Repeatable
  try {
    fs.unlinkSync(LOG_FILE);
  } catch (e) {
    // Ignore
  }
});

// Test 1: Cryptic name, tests too much - violates Understandable and Granular
it('test1', () => {
  testCounter++;
  const r1 = parser.parse('1+1');
  const r2 = parser.parse('2*3');
  const r3 = parser.parse('10/2');
  const r4 = parser.parse('5-3');
  const r5 = parser.parse('1+2+3');
  const r6 = parser.parse('2*3*4');

  expect(r1).toBe(2.0);
  expect(r2).toBe(6.0);
  expect(r3).toBe(5.0);
  expect(r4).toBe(2.0);
  expect(r5).toBe(6.0);
  expect(r6).toBe(24.0);

  lastResult = r6; // Shared state
  testLog.push('test1 passed');
});

// Test 2: Depends on test1 having run - violates Atomic
it('test2', () => {
  testCounter++;
  // This test subtly depends on shared state
  expect(parser).not.toBeNull();

  const result = parser.parse('24+1');
  expect(result).toBe(25.0);

  // Check that we ran after test1 (bad practice)
  expect(testLog.includes('test1 passed')).toBe(true);

  lastResult = result;
  testLog.push('test2 passed');
});

// Test 3: Unclear purpose, implementation details exposed - violates Understandable
it('testInternalState', () => {
  testCounter++;
  const p = new ExpressionParser();

  // Testing private implementation details using bracket notation
  // This tests implementation, not behavior
  p.parse('1+1');

  // In TypeScript, we can access private fields with bracket notation (bad practice)
  const pos = (p as any)['position'];
  expect(pos >= 0).toBe(true);

  testLog.push('testInternalState passed');
});

// Test 4: Flaky test with timing - violates Repeatable
it('testPerformance', () => {
  testCounter++;
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    parser.parse('1+2*3-4/2');
  }

  const elapsed = performance.now() - start;

  // This assertion may fail randomly based on system load
  expect(elapsed).toBeLessThan(100);

  testLog.push('testPerformance passed');
});

// Test 5: Redundant test - violates Necessary
it('testAdditionAgain', () => {
  testCounter++;
  expect(parser.parse('1+1')).toBe(2.0);
  expect(parser.parse('2+2')).toBe(4.0);
  expect(parser.parse('3+3')).toBe(6.0);
  // This is testing the same thing as test1

  testLog.push('testAdditionAgain passed');
});

// Test 6: Another redundant test - violates Necessary
it('testAdditionOnceMore', () => {
  testCounter++;
  expect(parser.parse('1+1')).toBe(2.0);
  // Exact duplicate of previous tests

  testLog.push('testAdditionOnceMore passed');
});

// Test 7: Massive test with unclear failures - violates Granular
it('testEverything', () => {
  testCounter++;

  // All operations
  expect(parser.parse('1+1')).toBe(2.0);
  expect(parser.parse('2*3')).toBe(6.0);
  expect(parser.parse('10/2')).toBe(5.0);
  expect(parser.parse('5-3')).toBe(2.0);

  // Parentheses
  expect(parser.parse('(1+2)*3')).toBe(9.0);
  expect(parser.parse('1+(2*3)')).toBe(7.0);

  // Decimals
  expect(parser.parse('1.5+1')).toBe(2.5);
  expect(parser.parse('1.5*2.5')).toBe(3.75);

  // Negatives
  expect(parser.parse('-1')).toBe(-1.0);
  expect(parser.parse('-1+1')).toBe(0.0);

  // Complex expressions
  expect(parser.parse('2+3*4')).toBe(14.0);
  expect(parser.parse('(2+3)*4')).toBe(20.0);
  expect(parser.parse('2*3+4')).toBe(10.0);
  expect(parser.parse('2*(3+4)')).toBe(14.0);

  // Nested parentheses
  expect(parser.parse('((1+2)*(3+4))')).toBe(21.0);
  expect(parser.parse('(2+(3*(1+1)))')).toBe(8.0);

  // Whitespace (tested implicitly)
  expect(parser.parse('  2  +  2  ')).toBe(4.0);

  // Errors - testing multiple error conditions
  expect(() => parser.parse('')).toThrow();
  expect(() => parser.parse(null as any)).toThrow();
  expect(() => parser.parse('1+')).toThrow();
  expect(() => parser.parse('(1+2')).toThrow();
  expect(() => parser.parse('1/0')).toThrow();

  testLog.push('testEverything passed');
});

// Test 8: Depends on external file system - violates Repeatable
it('testWithFileLogging', () => {
  testCounter++;

  const result = parser.parse('100/4');

  // Write result to file
  fs.appendFileSync(LOG_FILE, `Result: ${result}\n`);

  // Read back and verify
  const content = fs.readFileSync(LOG_FILE, 'utf-8');
  const found = content.includes('25');
  expect(found).toBe(true);

  expect(result).toBe(25.0);
  testLog.push('testWithFileLogging passed');
});

// Test 9: Slow test with unnecessary sleep - violates Fast
it('testWithDelay', async () => {
  testCounter++;

  const result = parser.parse('7*8');

  // Unnecessary delay - violates Fast principle
  await new Promise((resolve) => setTimeout(resolve, 500));

  expect(result).toBe(56.0);

  // Another unnecessary delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  testLog.push('testWithDelay passed');
});

// Test 10: Test that tests the test framework - violates Necessary
it('testTestFramework', () => {
  testCounter++;

  expect(true).toBe(true);
  expect(false).toBe(false);
  expect(new Object()).not.toBeNull();
  expect(1).toBe(1);

  testLog.push('testTestFramework passed');
});

// Test 11: Obscure magic numbers - violates Understandable
it('testMagicNumbers', () => {
  testCounter++;

  expect(parser.parse('6*7')).toBe(42.0);
  expect(parser.parse('3.14159')).toBeCloseTo(3.14159, 5);
  expect(parser.parse('2.71828')).toBeCloseTo(2.71828, 5);
  expect(parser.parse('1.41421')).toBeCloseTo(1.41421, 5);

  // What are these numbers? Why are we testing them?

  testLog.push('testMagicNumbers passed');
});

// Test 12: Order-dependent cleanup verification - violates Atomic
// Note: In Vitest, test order is not guaranteed without configuration
// This test MUST run last and verifies test execution order
it('verifyAllTestsRan', () => {
  // This test MUST run last and verifies test execution order
  expect(testLog.length).toBe(11);
  expect(testCounter).toBeGreaterThanOrEqual(11);
});
