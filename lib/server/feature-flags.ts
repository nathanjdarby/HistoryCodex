/** When true, manual page progress cannot award points — sessions required. */
export function readingSessionsRequired(): boolean {
  return process.env.READING_SESSIONS_REQUIRED === "true";
}
