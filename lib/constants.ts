export const MAX_DAILY_SECONDS = 86400; // 24 hours
export const ENTRIES_PER_PAGE = 20;

export const MESSAGES = {
  DAILY_LIMIT_REACHED: (hours: number, minutes: number) => 
    `Cannot start timer: You have already tracked 24 hours today (${hours}h ${minutes}m). Please complete entries for a different day.`,
  ENTRY_LIMIT_EXCEEDED: (hours: number, minutes: number) =>
    `Cannot add entry: This would exceed the 24-hour daily limit. Current total: ${hours}h ${minutes}m`,
  ENTRY_UPDATE_LIMIT_EXCEEDED: (date: string) =>
    `Cannot update entry: This would exceed the 24-hour daily limit for ${date}`,
};
