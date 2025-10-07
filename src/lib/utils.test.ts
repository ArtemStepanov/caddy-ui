import { describe, it, expect } from 'vitest';
import { cn, parseDurationToMs, formatDuration } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const condition = false;
    expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('parseDurationToMs', () => {
  it('should parse milliseconds', () => {
    expect(parseDurationToMs('2000ms')).toBe(2000);
    expect(parseDurationToMs('500ms')).toBe(500);
  });

  it('should parse seconds', () => {
    expect(parseDurationToMs('5s')).toBe(5000);
    expect(parseDurationToMs('1s')).toBe(1000);
  });

  it('should parse minutes', () => {
    expect(parseDurationToMs('2m')).toBe(120000);
    expect(parseDurationToMs('1m')).toBe(60000);
  });

  it('should parse hours', () => {
    expect(parseDurationToMs('1h')).toBe(3600000);
    expect(parseDurationToMs('2h')).toBe(7200000);
  });

  it('should parse days', () => {
    expect(parseDurationToMs('1d')).toBe(86400000);
  });

  it('should handle decimal values', () => {
    expect(parseDurationToMs('1.5s')).toBe(1500);
    expect(parseDurationToMs('2.5m')).toBe(150000);
  });

  it('should fallback to parseInt for invalid format', () => {
    expect(parseDurationToMs('invalid')).toBe(0);
    expect(parseDurationToMs('123')).toBe(123);
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(5500)).toBe('5.5s');
  });

  it('should format minutes', () => {
    expect(formatDuration(60000)).toBe('1.0m');
    expect(formatDuration(150000)).toBe('2.5m');
  });

  it('should format hours', () => {
    expect(formatDuration(3600000)).toBe('1.0h');
    expect(formatDuration(5400000)).toBe('1.5h');
  });
});
