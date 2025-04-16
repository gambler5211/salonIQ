'use client';

// Client component for dynamic routes in Next.js 15+
import { CustomerDetailClient } from './client-component';
import { useParams } from 'next/navigation';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  return <CustomerDetailClient customerId={id} />;
} 