import { useCallback, useState } from "react";

/**
 * Minimal open/close state for dialogs, dropdowns and panels.
 * Exists so components never reinvent `useState(false)` + handlers.
 */
export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  return { isOpen, open, close, toggle, setIsOpen } as const;
}
