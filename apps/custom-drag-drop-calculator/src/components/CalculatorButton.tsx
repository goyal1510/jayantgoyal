'use client';

import { useDrag } from "react-dnd";
import { useCalculatorStore } from "@/store/useCalculatorStore";
import { Button } from "@/components/ui/button";
import { CalculatorComponent } from "@/types";
import { cn } from "@/lib/utils";

interface CalculatorButtonProps {
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({ 
  label, 
  variant = 'default',
  size = 'default',
  className 
}) => {
  const { components, addComponent } = useCalculatorStore();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "COMPONENT",
    item: { type: "button", label } as CalculatorComponent,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleClick = () => {
    const alreadyAdded = components.some((comp) => comp.label === label);
    if (alreadyAdded) {
      if (typeof window !== 'undefined') {
        // Use a more subtle notification
        console.log(`Component "${label}" is already added!`);
      }
      return;
    }
    
    addComponent({ type: "button", label });
  };

  const getButtonVariant = () => {
    if (["="].includes(label)) return "default";
    if (["C", "<", "CE"].includes(label)) return "destructive";
    if (["+", "-", "*", "/", "%"].includes(label)) return "secondary";
    if (["±"].includes(label)) return "outline";
    return variant;
  };

  return (
    <Button
      ref={drag as unknown as React.RefObject<HTMLButtonElement>}
      variant={getButtonVariant()}
      size={size}
      className={cn(
        "transition-all duration-200 hover:scale-105 active:scale-95 select-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 scale-95",
        className
      )}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
};

export default CalculatorButton;
