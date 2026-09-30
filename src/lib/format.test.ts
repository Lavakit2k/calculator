import { describe, expect, it } from 'vitest';
import { fmtMin, parseAmount, parseDuration } from './format';

describe('parseDuration', () => {
  it.each([
    ['', 0],
    ['90', 90],
    ['1:30', 90],
    ['0:05', 5],
    ['2h', 120],
    ['1,5h', 90],
    ['1.5 h', 90],
    ['2h 15', 135],
    ['2h15m', 135],
    ['45m', 45],
    ['45 min', 45],
  ])('%s → %d', (input, expected) => expect(parseDuration(input)).toBe(expected));

  it.each(['abc', '1:75', '-5', '1:2:3'])('%s ist ungültig', (input) => expect(parseDuration(input)).toBeNull());
});

describe('parseAmount', () => {
  it.each([
    ['12,50', 12.5],
    ['12.5', 12.5],
    ['1.234,56', 1234.56],
    ['10 €', 10],
  ])('%s → %d', (input, expected) => expect(parseAmount(input)).toBe(expected));
  it('lehnt Unsinn ab', () => expect(parseAmount('abc')).toBeNull());
});

describe('fmtMin', () => {
  it('formatiert Minuten', () => {
    expect(fmtMin(30)).toBe('30 min');
    expect(fmtMin(95)).toBe('1:35 h');
    expect(fmtMin(600)).toBe('10:00 h');
  });
});
