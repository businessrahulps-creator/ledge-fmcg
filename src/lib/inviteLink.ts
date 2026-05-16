/**
 * Helpers for team-invite links + share copy.
 * Plain English, no jargon — works for a Kerala FMCG distributor
 * forwarding to their accountant on WhatsApp.
 */

export function buildInviteUrl(token: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  return `${origin}/invite/${token}`;
}

export function buildWhatsAppShare(companyName: string, token: string): string {
  const link = buildInviteUrl(token);
  const company = (companyName || "our workspace").trim();
  const message =
    `Hi! I've added you to ${company} on Ledge, our distribution management ` +
    `app. Tap the link below to join your team and get started: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildInviteShareText(companyName: string, token: string): string {
  const link = buildInviteUrl(token);
  const company = (companyName || "our workspace").trim();
  return (
    `Hi! I've added you to ${company} on Ledge, our distribution management ` +
    `app. Tap the link below to join your team and get started: ${link}`
  );
}
