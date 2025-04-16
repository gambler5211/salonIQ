import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Copy text to clipboard with fallbacks for different browser support
 * @param text Text to copy to clipboard
 * @returns Promise that resolves to true if successful, or error message
 */
export const copyToClipboard = async (text: string): Promise<true | string> => {
  try {
    // Try using the Clipboard API (modern browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return true;
      } else {
        return 'Copy command failed';
      }
    } catch (err) {
      document.body.removeChild(textArea);
      return String(err);
    }
  } catch (error) {
    return `Copy to clipboard is not supported in this browser: ${String(error)}`;
  }
};
