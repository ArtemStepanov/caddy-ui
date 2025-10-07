import { useCallback } from 'react';
import { useSettings } from '@/hooks/useSettingsContext';
import {
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
  formatRelativeTime,
  formatLastSeen as formatLastSeenUtil,
  formatShortRelativeTime,
} from '@/lib/date-utils';
import type { DateFormat, TimeFormat } from '@/types';

export function useDateFormat() {
  const { settings } = useSettings();
  const { dateFormat, timeFormat, showRelativeTimestamps } = settings.appearance;

  const formatDate = useCallback(
    (date: Date | string | null | undefined, customFormat?: DateFormat) => {
      return formatDateUtil(date, customFormat || dateFormat);
    },
    [dateFormat]
  );

  const formatTime = useCallback(
    (date: Date | string | null | undefined, customFormat?: TimeFormat) => {
      return formatTimeUtil(date, customFormat || timeFormat);
    },
    [timeFormat]
  );

  const formatDateTime = useCallback(
    (
      date: Date | string | null | undefined,
      customDateFormat?: DateFormat,
      customTimeFormat?: TimeFormat
    ) => {
      return formatDateTimeUtil(
        date,
        customDateFormat || dateFormat,
        customTimeFormat || timeFormat
      );
    },
    [dateFormat, timeFormat]
  );

  const formatLastSeen = useCallback(
    (date: Date | string | null | undefined) => {
      return formatLastSeenUtil(date, {
        showRelative: showRelativeTimestamps,
        dateFormat,
        timeFormat,
      });
    },
    [showRelativeTimestamps, dateFormat, timeFormat]
  );

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatLastSeen,
    formatRelativeTime,
    formatShortRelativeTime,
    dateFormat,
    timeFormat,
    showRelativeTimestamps,
  };
}
