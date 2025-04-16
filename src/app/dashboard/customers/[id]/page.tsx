// Server component - handles param unwrapping and passes to client component
import { CustomerDetailClient } from './client-component';

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Extract the ID directly at the server component level
  return <CustomerDetailClient customerId={params.id} />;
} 