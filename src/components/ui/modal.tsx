import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: keyof typeof sizeClasses;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Opinionated, controlled wrapper over `Dialog` for the common
 * title / body / footer case. Drop to the `Dialog` primitives directly
 * when a bespoke composition is needed.
 */
function Modal({
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = "md",
  showCloseButton = true,
  className,
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={showCloseButton} className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description !== undefined && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer !== undefined && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export { Modal, type ModalProps };
