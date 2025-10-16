import type { DateFormat, TimeFormat } from '@/types';

export function formatDate(
  date: Date | string | null | undefined,
  format: DateFormat = 'YYYY-MM-DD'
): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

export function formatTime(
  date: Date | string | null | undefined,
  format: TimeFormat = '24h'
): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const hours = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  
  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes}:${seconds} ${period}`;
  }
}

export function formatDateTime(
  date: Date | string | null | undefined,
  dateFormat: DateFormat = 'YYYY-MM-DD',
  timeFormat: TimeFormat = '24h'
): string {
  if (!date) return '';
  
  const formattedDate = formatDate(date, dateFormat);
  const formattedTime = formatTime(date, timeFormat);
  
  return `${formattedDate} ${formattedTime}`;
}

export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return 'Never';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 10) return 'just now';
  if (diffSecs < 30) return 'a few seconds ago';
  if (diffSecs < 60) return `${diffSecs} seconds ago`;
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export function formatLastSeen(
  lastSeen: Date | string | null | undefined,
  options: {
    showRelative?: boolean;
    dateFormat?: DateFormat;
    timeFormat?: TimeFormat;
  } = {}
): string {
  if (!lastSeen) return 'Never';
  
  const { showRelative = true, dateFormat = 'YYYY-MM-DD' } = options;
  
  const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  if (showRelative) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  return formatDate(date, dateFormat);
}

export function formatShortRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return 'Never';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return `${diffDays}d ago`;
}
