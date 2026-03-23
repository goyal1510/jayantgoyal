'use client';

import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { useThreeBgStore } from '@/lib/stores/use-three-bg-store';

export function ThreeBgToggle() {
  const [mounted, setMounted] = useState(false);
  const enabled = useThreeBgStore((s) => s.enabled);
  const toggle = useThreeBgStore((s) => s.toggle);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Toggle 3D background"
    >
      <Box
        className={`h-[1.2rem] w-[1.2rem] transition-opacity ${mounted && !enabled ? 'opacity-40' : 'opacity-100'}`}
      />
    </Button>
  );
}
