import { forwardRef, type ImgHTMLAttributes } from "react";
/** Stand-in for next/image: Arc ships for Next.js, Ledge runs on Vite. */
type Props = ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; unoptimized?: boolean; sizes?: string };
const Image = forwardRef<HTMLImageElement, Props>(function Image({ fill, priority, unoptimized: _u, style, ...rest }, ref) {
  return <img ref={ref} {...rest} loading={priority ? "eager" : "lazy"} decoding="async" style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style } : style} />;
});
export default Image;
