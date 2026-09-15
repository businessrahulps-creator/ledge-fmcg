import { Font } from "@react-pdf/renderer";
import NotoSansRegular from "@/assets/fonts/NotoSans-Regular.ttf";
import NotoSansBold from "@/assets/fonts/NotoSans-Bold.ttf";

/**
 * Brand font for every generated PDF.
 * Noto Sans carries the rupee sign (U+20B9), which the built-in Helvetica does not,
 * so all money in exported documents can print as "₹1,234.00".
 */
export const PDF_FONT = "LedgeSans";

let registered = false;

export function ensurePdfFonts() {
  if (registered) return;
  registered = true;
  try {
    Font.register({
      family: PDF_FONT,
      fonts: [
        { src: NotoSansRegular, fontWeight: 400 },
        { src: NotoSansBold, fontWeight: 700 },
      ],
    });
    // Keep words intact — react-pdf's default hyphenation splits product names mid-word.
    Font.registerHyphenationCallback((word) => [word]);
  } catch {
    registered = false;
  }
}

ensurePdfFonts();

/** Bold text style — use instead of the old fontFamily: "Helvetica-Bold". */
export const bold = { fontFamily: PDF_FONT, fontWeight: 700 } as const;
