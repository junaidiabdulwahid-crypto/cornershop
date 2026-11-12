/** Start of the current India day (00:00 IST) as a Date. India has no daylight saving. */
export function startOfIndiaDay(now: Date = new Date()): Date {
  const istOffsetMs = 330 * 60 * 1000; // 5 h 30 min
  const ist = new Date(now.getTime() + istOffsetMs); // shift the clock to IST
  ist.setUTCHours(0, 0, 0, 0); // midnight of that day
  return new Date(ist.getTime() - istOffsetMs); // back to the real (UTC) instant
}
