import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#007BFF] text-white hover:bg-[#0054A6]",
        accent:
          "border-transparent bg-[#FFD602] text-[#000000] font-bold hover:bg-[#E6C000]",
        secondary:
          "border-transparent bg-[#6C757D] text-white hover:bg-[#4E4E50]",
        destructive:
          "border-transparent bg-[#DC2626] text-white hover:bg-[#B91C1C]",
        success:
          "border-transparent bg-[#10B981] text-white hover:bg-[#059669]",
        warning:
          "border-transparent bg-[#F59E0B] text-white hover:bg-[#D97706]",
        outline:
          "border-[#CED4DA] bg-transparent text-[#4E4E50]",
        subtle:
          "border-[#CED4DA] bg-[#F6F6F6] text-[#4E4E50]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
