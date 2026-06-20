// 日本語の曜日ラベル。Temporal.ZonedDateTime.dayOfWeek は 1=月曜 ... 7=日曜。
/**
 * Japanese short weekday labels indexed by Temporal dayOfWeek (1-7).
 * @since v3.0.3
 * @type {string[]}
 */
const WEEKDAYS_JA = ['月', '火', '水', '木', '金', '土', '日'];

/**
 * Format an ISO datetime string into a JST string like "5月25日(月) 10:00".
 * Uses the built-in Temporal API so coop (message-maker) and battle
 * (battle-message-maker) messages share an identical date format without an
 * external date library.
 * @since v3.0.3
 * @param {string} isoString - ISO 8601 datetime string.
 * @returns {string} - Formatted JST datetime, e.g. "5月25日(月) 10:00".
 */
export const formatJst = (isoString) => {
  const zdt = Temporal.Instant.fromEpochMilliseconds(Date.parse(isoString)).toZonedDateTimeISO(
    'Asia/Tokyo'
  );
  const weekday = WEEKDAYS_JA[zdt.dayOfWeek - 1];
  const hour = String(zdt.hour).padStart(2, '0');
  const minute = String(zdt.minute).padStart(2, '0');
  return `${zdt.month}月${zdt.day}日(${weekday}) ${hour}:${minute}`;
};
