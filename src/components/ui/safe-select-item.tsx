'use client';

import React from 'react';
import { SelectItem } from './select';

interface SafeSelectItemProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectItem>, 'value'> {
  value?: string | null | undefined;
  fallback?: string;
}

export function SafeSelectItem({ 
  value, 
  fallback = 'placeholder-value',
  children,
  ...props 
}: SafeSelectItemProps) {
  // Ensure value is never an empty string
  const safeValue = value || fallback || `value-${Math.random().toString(36).substring(2)}`;
  
  return (
    <SelectItem value={safeValue} {...props}>
      {children}
    </SelectItem>
  );
} 