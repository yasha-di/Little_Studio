import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving conflicts in favor of the latter.
 * The single styling utility every component uses — keeps class handling
 * consistent across the codebase.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copies text to the clipboard. Falls back to a hidden textarea when the
 * async Clipboard API is unavailable (older webviews, non-secure contexts).
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- intentional last-resort fallback for webviews without the async Clipboard API
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}
