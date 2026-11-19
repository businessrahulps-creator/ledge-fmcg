/** Capability values come from the server-backed permission provider, not role guesses. */
export function dashboardAccess(seeMoney: boolean, manageBusiness: boolean) {
  return { money: seeMoney, setup: manageBusiness };
}

export function indiaGreeting(now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23",
  }).format(now));
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}