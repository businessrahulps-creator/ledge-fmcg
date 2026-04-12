const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
}

function threeDigits(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + twoDigits(n % 100) : "");
}

/**
 * Convert a number to Indian currency words.
 * e.g. 1,23,456.78 → "One Lakh Twenty Three Thousand Four Hundred and Fifty Six Rupees and Seventy Eight Paise Only"
 */
export function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";

  const isNegative = amount < 0;
  amount = Math.abs(amount);

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = "";

  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;

    const parts: string[] = [];
    if (crore > 0) parts.push(twoDigits(crore) + " Crore");
    if (lakh > 0) parts.push(twoDigits(lakh) + " Lakh");
    if (thousand > 0) parts.push(twoDigits(thousand) + " Thousand");
    if (remainder > 0) parts.push(threeDigits(remainder));

    words = parts.join(" ") + " Rupees";
  }

  if (paise > 0) {
    words += (rupees > 0 ? " and " : "") + twoDigits(paise) + " Paise";
  }

  return (isNegative ? "Minus " : "") + words + " Only";
}
