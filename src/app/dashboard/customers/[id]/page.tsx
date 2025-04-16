// Server component - handles param unwrapping and passes to client component
import { CustomerDetailClient } from './client-component';

type CustomerDetailPageProps = {
  params: {
    id: string;
  };
};

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  // Extract the ID directly at the server component level
  return <CustomerDetailClient customerId={params.id} />;
} 