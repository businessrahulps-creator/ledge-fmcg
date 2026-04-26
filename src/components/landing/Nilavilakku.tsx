import { motion, useReducedMotion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Nilavilakku — traditional Kerala brass oil lamp.
 * Hand-drawn inline SVG (~18×22), warm brass body with a softly flickering
 * amber flame and a synced halo pulse. Respects prefers-reduced-motion.
 */
export function Nilavilakku() {
  const reduce = useReducedMotion();

  const flameAnim = reduce
    ? {}
    : {
        scaleY: [1, 1.06, 0.97, 1.04, 1],
        scaleX: [1, 0.98, 1.02, 0.99, 1],
        rotate: [0, 0.6, -0.4, 0.3, 0],
      };

  const haloAnim = reduce
    ? { opacity: 0.55 }
    : {
        opacity: [0.5, 0.85, 0.6, 0.8, 0.5],
        scale: [1, 1.14, 1.02, 1.09, 1],
      };

  const lampSvg = (
    <span className="inline-flex items-center justify-center" aria-hidden>
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6C36A" />
            <stop offset="45%" stopColor="#B8901E" />
            <stop offset="100%" stopColor="#6B5212" />
          </linearGradient>
          <linearGradient id="brassRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F2D784" />
            <stop offset="100%" stopColor="#9A7818" />
          </linearGradient>
          <radialGradient id="flameGrad" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#FFF6DC" />
            <stop offset="40%" stopColor="#FFD27A" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD27A" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* Halo glow behind flame */}
        <motion.circle
          cx="9"
          cy="5"
          r="5.5"
          fill="url(#halo)"
          style={{ transformOrigin: "9px 5px" }}
          animate={haloAnim}
          transition={
            reduce
              ? undefined
              : { duration: 3.4, ease: [0.45, 0, 0.55, 1], repeat: Infinity, delay: 0.2 }
          }
        />

        {/* Flame */}
        <motion.g
          style={{ transformOrigin: "9px 8.5px" }}
          animate={flameAnim}
          transition={
            reduce
              ? undefined
              : { duration: 3.4, ease: [0.45, 0, 0.55, 1], repeat: Infinity }
          }
        >
          <path
            d="M9 2.4 C 10.6 4.6, 11.1 6.2, 10.4 7.6 C 9.9 8.6, 8.1 8.6, 7.6 7.6 C 6.9 6.2, 7.4 4.6, 9 2.4 Z"
            fill="url(#flameGrad)"
            filter="url(#softBlur)"
          />
          <path
            d="M9 3.8 C 9.9 5.2, 10.1 6.2, 9.7 7.0 C 9.4 7.6, 8.6 7.6, 8.3 7.0 C 7.9 6.2, 8.1 5.2, 9 3.8 Z"
            fill="#FFF6DC"
            opacity="0.9"
          />
        </motion.g>

        {/* Wick */}
        <rect x="8.6" y="8.2" width="0.8" height="1.4" rx="0.2" fill="#3F2A0A" />

        {/* Oil bowl (top dish) */}
        <ellipse cx="9" cy="9.6" rx="4.6" ry="1.1" fill="url(#brassRim)" />
        <path
          d="M4.6 9.6 C 5.0 11.0, 6.6 11.6, 9 11.6 C 11.4 11.6, 13 11.0, 13.4 9.6 Z"
          fill="url(#brass)"
        />

        {/* Stem */}
        <rect x="8.3" y="11.5" width="1.4" height="3.2" fill="url(#brass)" />
        <ellipse cx="9" cy="14.7" rx="2.2" ry="0.55" fill="url(#brassRim)" />

        {/* Mid disk */}
        <ellipse cx="9" cy="15.2" rx="1.8" ry="0.45" fill="url(#brass)" />
        <rect x="8.4" y="15.4" width="1.2" height="2.4" fill="url(#brass)" />

        {/* Base */}
        <ellipse cx="9" cy="18.0" rx="3.6" ry="0.8" fill="url(#brassRim)" />
        <path
          d="M5.4 18 C 5.8 19.6, 7.2 20.4, 9 20.4 C 10.8 20.4, 12.2 19.6, 12.6 18 Z"
          fill="url(#brass)"
        />
        <ellipse cx="9" cy="20.3" rx="3.2" ry="0.55" fill="#5C4A14" opacity="0.55" />
      </svg>
    </span>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default">{lampSvg}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-body text-[11.5px]">
          നിലവിളക്ക് · Nilavilakku
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
