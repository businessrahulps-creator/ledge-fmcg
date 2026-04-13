import { forwardRef, useState, useEffect, useRef, ReactNode } from "react";
import { motion, useInView } from "framer-motion";

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const AnimateIn = forwardRef<HTMLDivElement, AnimateInProps>(
  function AnimateIn({ children, className, delay = 0 }, _ref) {
    const innerRef = useRef(null);
    const isInView = useInView(innerRef, { once: true, margin: "-80px" });

    return (
      <motion.div
        ref={innerRef}
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", damping: 26, stiffness: 200, delay }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

export function useCountUp(end: number, isInView: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return count;
}
