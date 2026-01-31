"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";

interface TypewriterProps {
  /**
   * The text to type out
   */
  text: string;
  /**
   * Speed of typing in milliseconds per character
   * @default 50
   */
  speed?: number;
  /**
   * Initial delay before typing starts in milliseconds
   * @default 0
   */
  delay?: number;
  /**
   * Whether to show a blinking cursor
   * @default true
   */
  cursor?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when typing is complete
   */
  onComplete?: () => void;
}

export function Typewriter({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  className,
  onComplete,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setIsTyping(false);
    setHasStarted(false);
  }, [text]);

  useEffect(() => {
    if (hasStarted) return;

    const startTimeout = setTimeout(() => {
      setHasStarted(true);
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay, hasStarted]);

  useEffect(() => {
    if (!isTyping || !hasStarted) return;

    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      onComplete?.();
    }
  }, [displayedText, isTyping, hasStarted, text, speed, onComplete]);

  return (
    <span className={cn("inline", className)}>
      {displayedText}
      {cursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="inline-block w-[2px] h-[1em] bg-current ml-1 align-middle"
        />
      )}
    </span>
  );
}

export default Typewriter;
