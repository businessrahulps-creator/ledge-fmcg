/**
 * Format a date string or Date object to Indian locale DD/MM/YYYY in IST.
 */
export const formatIndianDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string"
    ? new Date(date + (date.length === 10 ? "T00:00:00" : ""))
    : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
};
