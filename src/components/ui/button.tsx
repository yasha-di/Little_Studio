import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Spinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-default items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,filter] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-loading:[&_svg:not([data-slot=spinner])]:hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary bg-[image:var(--gradient-btn-primary)] text-primary-foreground shadow-btn-primary hover:shadow-btn-primary-hover hover:brightness-110 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        secondary: "bg-secondary text-secondary-foreground shadow-raised hover:bg-secondary/80",
        outline:
          "border border-input bg-transparent hover:border-border-strong hover:bg-accent hover:text-accent-foreground",
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive bg-linear-to-b from-white/10 to-transparent text-destructive-foreground shadow-raised hover:brightness-110 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5 py-2",
        sm: "h-7 gap-1.5 rounded-md px-2.5 text-xs",
        lg: "h-9 rounded-md px-5",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Async-in-flight state: shows a spinner and disables the button. */
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={loading ? true : disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <Spinner className="text-current" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
