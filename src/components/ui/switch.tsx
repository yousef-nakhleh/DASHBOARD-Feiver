import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<"button"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  asChild?: boolean;
}

const switchVariants = cva(
  "inline-flex items-center h-[24px] w-[44px] rounded-full transition-colors focus:outline-none",
  {
    variants: {
      checked: {
        true: "bg-black",
        false: "bg-gray-200",
      },
    },
  }
);

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        role="switch"
        aria-checked={checked}
        className={cn(switchVariants({ checked }), className)}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition",
            checked ? "translate-x-[20px]" : "translate-x-[4px]"
          )}
        />
      </Comp>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };