'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function PageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
    };

    const handleStop = () => {
      setIsLoading(false);
    };

    // Create a MutationObserver to watch for changes to the document body
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('nprogress-busy')) {
        handleStart();
      } else {
        handleStop();
      }
    });

    observer.observe(document.body, {
      attributeFilter: ['class'],
      attributes: true
    });

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleStop);

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleStop);
    };
  }, []);

  // When path or search params change, turn off loading
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#ff7b54]" />
        <p className="mt-4 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
} 