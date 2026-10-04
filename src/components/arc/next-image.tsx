import type { ImgHTMLAttributes } from "react";
/** Stand-in for next/image: Arc ships for Next.js, Ledge runs on Vite. */
type Props = ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; unoptimized?: boolean; sizes?: string };
export default function Image({ fill, priority, unoptimized, style, ...rest }: Props) {
  return <img {...rest} loading={priority ? "eager" : "lazy"} decoding="async" style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style} />;
}
