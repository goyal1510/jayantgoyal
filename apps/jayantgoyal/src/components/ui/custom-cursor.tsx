"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface Position {
  x: number;
  y: number;
}

const TRAIL_LENGTH = 12;

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Position[]>([]);
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Check if hovering over a clickable element
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        window.getComputedStyle(target).cursor === "pointer";

      setIsPointer(isClickable);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    document.body.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  // Update trail with animation frame for smooth effect
  useEffect(() => {
    const updateTrail = () => {
      setTrail((prevTrail) => {
        const newTrail = [mousePosition, ...prevTrail.slice(0, TRAIL_LENGTH - 1)];
        return newTrail;
      });
      animationRef.current = requestAnimationFrame(updateTrail);
    };

    animationRef.current = requestAnimationFrame(updateTrail);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePosition]);

  // Don't render on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return null;
  }

  return (
    <>
      {/* Trail dots */}
      {trail.map((pos, index) => {
        const size = Math.max(4, 12 - index * 0.7);
        const opacity = Math.max(0.1, 0.8 - index * 0.06);

        return (
          <motion.div
            key={index}
            className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full bg-slate-500 dark:bg-slate-300"
            style={{
              width: size,
              height: size,
              x: pos.x - size / 2,
              y: pos.y - size / 2,
              opacity: isVisible ? opacity : 0,
            }}
          />
        );
      })}
      {/* Main dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-slate-600 dark:bg-slate-200"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          scale: isPointer ? 1.4 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
          mass: 0.5,
        }}
        style={{
          width: 12,
          height: 12,
        }}
      />
    </>
  );
}

export default CustomCursor;
