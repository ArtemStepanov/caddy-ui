import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatLastSeen,
  formatShortRelativeTime,
} from './date-utils';

describe('date-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format date in YYYY-MM-DD format', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-03-15');
    });

    it('should format date in DD/MM/YYYY format', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/03/2024');
    });

    it('should format date in MM/DD/YYYY format', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('03/15/2024');
    });

    it('should handle string dates', () => {
      const dateStr = '2024-03-15T10:30:00Z';
      expect(formatDate(dateStr, 'YYYY-MM-DD')).toBe('2024-03-15');
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('');
    });

    it('should use default format when not specified', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date)).toBe('2024-03-15');
    });
  });

  describe('formatTime', () => {
    it('should format time in 24h format', () => {
      const date = new Date('2024-03-15T14:30:45Z');
      expect(formatTime(date, '24h')).toBe('14:30:45');
    });

    it('should format time in 12h format with PM', () => {
      const date = new Date('2024-03-15T14:30:45Z');
      expect(formatTime(date, '12h')).toBe('2:30:45 PM');
    });

    it('should format time in 12h format with AM', () => {
      const date = new Date('2024-03-15T08:30:45Z');
      expect(formatTime(date, '12h')).toBe('8:30:45 AM');
    });

    it('should handle midnight correctly in 12h format', () => {
      const date = new Date('2024-03-15T00:00:00Z');
      expect(formatTime(date, '12h')).toBe('12:00:00 AM');
    });

    it('should handle noon correctly in 12h format', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(formatTime(date, '12h')).toBe('12:00:00 PM');
    });

    it('should return empty string for null', () => {
      expect(formatTime(null)).toBe('');
    });

    it('should use default format when not specified', () => {
      const date = new Date('2024-03-15T14:30:45Z');
      expect(formatTime(date)).toBe('14:30:45');
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time formatting', () => {
      const date = new Date('2024-03-15T14:30:45Z');
      expect(formatDateTime(date, 'YYYY-MM-DD', '24h')).toBe('2024-03-15 14:30:45');
    });

    it('should work with DD/MM/YYYY and 12h format', () => {
      const date = new Date('2024-03-15T14:30:45Z');
      expect(formatDateTime(date, 'DD/MM/YYYY', '12h')).toBe('15/03/2024 2:30:45 PM');
    });

    it('should return empty string for null', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for very recent dates', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const recent = new Date('2024-03-15T09:59:55Z');
      expect(formatRelativeTime(recent)).toBe('just now');
    });

    it('should return "a few seconds ago" for 20 seconds', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const recent = new Date('2024-03-15T09:59:40Z');
      expect(formatRelativeTime(recent)).toBe('a few seconds ago');
    });

    it('should return seconds for less than a minute', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:59:15Z');
      expect(formatRelativeTime(date)).toBe('45 seconds ago');
    });

    it('should return "1 minute ago" for exactly 1 minute', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:59:00Z');
      expect(formatRelativeTime(date)).toBe('1 minute ago');
    });

    it('should return minutes for less than an hour', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:30:00Z');
      expect(formatRelativeTime(date)).toBe('30 minutes ago');
    });

    it('should return "1 hour ago" for exactly 1 hour', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:00:00Z');
      expect(formatRelativeTime(date)).toBe('1 hour ago');
    });

    it('should return hours for less than a day', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T06:00:00Z');
      expect(formatRelativeTime(date)).toBe('4 hours ago');
    });

    it('should return "1 day ago" for exactly 1 day', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-14T10:00:00Z');
      expect(formatRelativeTime(date)).toBe('1 day ago');
    });

    it('should return days for less than a week', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-12T10:00:00Z');
      expect(formatRelativeTime(date)).toBe('3 days ago');
    });

    it('should return weeks for less than a month', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-01T10:00:00Z');
      expect(formatRelativeTime(date)).toBe('2 weeks ago');
    });

    it('should return months for less than a year', () => {
      const now = new Date('2024-06-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T10:00:00Z');
      expect(formatRelativeTime(date)).toBe('3 months ago');
    });

    it('should return years for more than a year', () => {
      const now = new Date('2025-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T10:00:00Z');
      expect(formatRelativeTime(date)).toBe('1 year ago');
    });

    it('should return "Never" for null', () => {
      expect(formatRelativeTime(null)).toBe('Never');
    });

    it('should return "Invalid date" for invalid date string', () => {
      expect(formatRelativeTime('invalid')).toBe('Invalid date');
    });
  });

  describe('formatLastSeen', () => {
    it('should return "Never" for null', () => {
      expect(formatLastSeen(null)).toBe('Never');
    });

    it('should return relative time when showRelative is true', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:55:00Z');
      expect(formatLastSeen(date, { showRelative: true })).toBe('5 minutes ago');
    });

    it('should return absolute date when showRelative is false', () => {
      const date = new Date('2024-03-15T10:00:00Z');
      expect(formatLastSeen(date, { showRelative: false, dateFormat: 'YYYY-MM-DD' })).toBe('2024-03-15');
    });

    it('should switch to absolute date after 7 days even with showRelative true', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-01T10:00:00Z');
      expect(formatLastSeen(date, { showRelative: true, dateFormat: 'YYYY-MM-DD' })).toBe('2024-03-01');
    });

    it('should use provided date format', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-01T10:00:00Z');
      expect(formatLastSeen(date, { showRelative: true, dateFormat: 'DD/MM/YYYY' })).toBe('01/03/2024');
    });
  });

  describe('formatShortRelativeTime', () => {
    it('should return "Never" for null', () => {
      expect(formatShortRelativeTime(null)).toBe('Never');
    });

    it('should return "just now" for very recent', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const recent = new Date('2024-03-15T09:59:55Z');
      expect(formatShortRelativeTime(recent)).toBe('just now');
    });

    it('should return short format for seconds', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:59:30Z');
      expect(formatShortRelativeTime(date)).toBe('30s ago');
    });

    it('should return short format for minutes', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T09:30:00Z');
      expect(formatShortRelativeTime(date)).toBe('30m ago');
    });

    it('should return short format for hours', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-15T06:00:00Z');
      expect(formatShortRelativeTime(date)).toBe('4h ago');
    });

    it('should return short format for days', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);
      
      const date = new Date('2024-03-12T10:00:00Z');
      expect(formatShortRelativeTime(date)).toBe('3d ago');
    });
  });
});
