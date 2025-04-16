'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Loader2, 
  Calendar, 
  Search, 
  Grid, 
  List, 
  ChevronRight, 
  Clock,
  X,
  FilterX,
  Phone
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getCustomers, deleteCustomer } from '@/lib/db-service';
import { Customer, ServiceHistory } from '@/lib/types';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  doc, 
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Quick service schema
const quickServiceSchema = z.object({
  services: z.array(z.string()).min(1, { message: 'Please select at least one service' }),
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)), 
    { message: 'Please enter a valid date' }
  ),
  notes: z.string().optional(),
});

type QuickServiceFormValues = z.infer<typeof quickServiceSchema>;

// Services offered (would typically come from a database)
const availableServices = [
  'Haircut',
  'Color',
  'Blowout',
  'Styling',
  'Perm',
  'Treatment',
  'Manicure',
  'Pedicure',
  'Facial',
  'Massage',
  'Waxing',
  'Other'
];

// Service color mapping for visual distinction
const serviceColors: Record<string, {bg: string, text: string, border: string}> = {
  'Haircut': {bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200'},
  'Color': {bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200'},
  'Blowout': {bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200'},
  'Styling': {bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200'},
  'Perm': {bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200'},
  'Treatment': {bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200'},
  'Manicure': {bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200'},
  'Pedicure': {bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200'},
  'Facial': {bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200'},
  'Massage': {bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200'},
  'Waxing': {bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200'},
  'Other': {bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200'}
};

// Function to format phone display
function formatPhoneDisplay(phone: string) {
  return (
    <div className="flex items-center">
      <span className="text-xs font-medium text-gray-500 mr-1">+91</span>
      <span>{phone}</span>
    </div>
  );
}

// Function to get customer initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Function to get days since last visit in user-friendly format
function formatDaysSince(lastVisit: string): { text: string, className: string } {
  try {
    const visitDate = new Date(lastVisit);
    const today = new Date();
    const days = differenceInDays(today, visitDate);
    
    if (days === 0) {
      return { 
        text: 'Today', 
        className: 'bg-green-100 text-green-800' 
      };
    } else if (days === 1) {
      return { 
        text: 'Yesterday',
        className: 'bg-blue-100 text-blue-800'
      };
    } else if (days <= 7) {
      return { 
        text: `${days}d`,
        className: 'bg-blue-50 text-blue-800'
      };
    } else if (days <= 30) {
      return { 
        text: `${days}d`,
        className: 'bg-gray-100 text-gray-800'
      };
    } else {
      return { 
        text: `${days}d`,
        className: 'bg-amber-100 text-amber-800'
      };
    }
  } catch {
    return { text: '?', className: 'bg-gray-100 text-gray-800' };
  }
}

// Function to format detailed visit time
function formatDetailedVisitTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const formattedDate = format(date, 'MMM d, yyyy');
    const formattedTime = format(date, 'h:mm a');
    return `Visited on ${formattedDate} at ${formattedTime}`;
  } catch {
    return "Date information unavailable";
  }
}

export default function CustomersPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeServiceFilter, setActiveServiceFilter] = useState<string>('');
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  
  // New pagination state
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [lastDocRef, setLastDocRef] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageSize] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isQuickServiceDialogOpen, setIsQuickServiceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [isCustomerPreview, setIsCustomerPreview] = useState(false);
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
  const [previewHistory, setPreviewHistory] = useState<ServiceHistory[]>([]);

  const quickServiceForm = useForm<QuickServiceFormValues>({
    resolver: zodResolver(quickServiceSchema),
    defaultValues: {
      services: [],
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Fetch customers function definition
  const fetchCustomers = useCallback(async () => {
    if (!salonId) return;
    
    setIsLoading(true);
    try {
      const result = await getCustomers(salonId, pageSize);
      setCustomers(result.customers);
      setTotalCustomers(result.totalCount);
      setLastDocRef(result.lastDoc);
      setHasNextPage(result.customers.length === pageSize && result.totalCount > pageSize);
      
      // Collect unique services for filtering
      const services = new Set<string>();
      result.customers.forEach(customer => {
        if (customer.serviceArray && customer.serviceArray.length > 0) {
          customer.serviceArray.forEach(service => services.add(service));
        } else if (customer.service) {
          services.add(customer.service);
        }
      });
      setServiceOptions(Array.from(services));
      
      // Debug: Check first customer data
      if (result.customers.length > 0) {
        console.log('First customer data:', result.customers[0]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [salonId, pageSize]);

  // Add this function to load the next page of customers
  const loadMoreCustomers = async () => {
    if (!salonId || !lastDocRef) return;
    
    setIsLoadingMore(true);
    try {
      const result = await getCustomers(salonId, pageSize, lastDocRef);
      
      // Combine with existing customers
      setCustomers(prevCustomers => [...prevCustomers, ...result.customers]);
      setLastDocRef(result.lastDoc);
      setHasNextPage(result.customers.length === pageSize);
    } catch (error) {
      console.error('Error loading more customers:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch customers
    fetchCustomers();
  }, [user, salonId, loading, router, fetchCustomers]);

  useEffect(() => {
    // Filter customers based on search query and active filters
    if (customers.length > 0) {
      let result = [...customers];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(customer => 
          customer.name.toLowerCase().includes(query) || 
          customer.phone.includes(query)
        );
      }
      
      // Apply time-based filters
      if (activeFilter === 'recent') {
        result = result.filter(customer => {
          const days = lastServiceDays(customer.last_visit);
          return days <= 7; // Visits in the last week
        });
      } else if (activeFilter === 'overdue') {
        result = result.filter(customer => {
          const days = lastServiceDays(customer.last_visit);
          return days > 30; // Haven't visited in over a month
        });
      }
      
      // Apply service-based filters
      if (activeServiceFilter) {
        result = result.filter(customer => {
          if (customer.serviceArray && customer.serviceArray.length > 0) {
            return customer.serviceArray.includes(activeServiceFilter);
          }
          return customer.service === activeServiceFilter;
        });
      }
      
      setFilteredCustomers(result);
    } else {
      setFilteredCustomers([]);
    }
  }, [customers, searchQuery, activeFilter, activeServiceFilter]);

  async function onDeleteCustomer(id: string) {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await deleteCustomer(id);
      // After deletion, refresh data instead of filtering locally
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  }

  async function loadServiceHistory(customerId: string) {
    try {
      console.log('Loading service history for customer:', customerId);
      const historyQuery = query(
        collection(db, 'service_history'),
        where('customer_id', '==', customerId),
        orderBy('created_at', 'desc')
      );
      
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceHistory[];
      
      console.log('Loaded service history:', history);
      return history;
    } catch (error) {
      console.error('Error loading service history:', error);
      return [];
    }
  }

  async function onQuickService(customer: Customer) {
    console.log('Quick service for customer:', customer);
    
    if (!customer.id) {
      console.error('Customer missing ID:', customer);
      alert('Error: Customer data is invalid');
      return;
    }
    
    setSelectedCustomer(customer);
    setSelectedServices(customer.service ? [customer.service] : []);
    quickServiceForm.setValue('services', customer.service ? [customer.service] : []);
    quickServiceForm.setValue('date', new Date().toISOString().split('T')[0]);
    
    // Load service history for this customer
    const history = await loadServiceHistory(customer.id);
    setServiceHistory(history);
    
    setIsQuickServiceDialogOpen(true);
  }

  async function addQuickService(data: QuickServiceFormValues) {
    if (!salonId || !selectedCustomer?.id) {
      console.error('Missing required data:', { salonId, customerId: selectedCustomer?.id });
      alert('Missing required customer data');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get primary service
      const primaryService = data.services[0]; // Use first selected service as primary
      
      if (!primaryService) {
        throw new Error('No service selected');
      }
      
      // Step 1: Create a new service history entry FIRST
      const newServiceHistory: Omit<ServiceHistory, 'id'> = {
        customer_id: selectedCustomer.id,
        service: data.services.join(', '),
        serviceArray: data.services,
        isMultiService: data.services.length > 1,
        date: data.date,
        notes: data.notes || '',
        created_at: new Date().toISOString(),
      };
      
      // Step 2: Save the service history to Firestore
      const serviceHistoryRef = await addDoc(collection(db, 'service_history'), newServiceHistory);
      console.log('Service history created with ID:', serviceHistoryRef.id);
      
      // Step 3: THEN update the customer record with latest service
      const customerRef = doc(db, 'customers', selectedCustomer.id);
      
      // Get current customer data to ensure it exists
      const customerSnap = await getDoc(customerRef);
      
      if (!customerSnap.exists()) {
        throw new Error(`Customer document with ID ${selectedCustomer.id} not found`);
      }
      
      // Update only the most recent service information
      const updateData = {
        service: primaryService,
        serviceArray: data.services,
        isMultiService: data.services.length > 1,
        last_visit: data.date
      };
      
      console.log('DIRECT UPDATE - Customer ID:', selectedCustomer.id);
      console.log('DIRECT UPDATE - Update data:', updateData);
      
      // Use setDoc with merge option to ensure update happens
      await setDoc(customerRef, updateData, { merge: true });
      
      // Verify update was successful
      const updatedSnap = await getDoc(customerRef);
      const updatedData = updatedSnap.data();
      
      if (updatedData?.service !== primaryService) {
        throw new Error('Update verification failed - service not updated');
      }
      
      console.log('DIRECT UPDATE - Customer updated successfully!', updatedData);
      
      // Add the new history item to our state
      const newHistoryItem: ServiceHistory = {
        id: serviceHistoryRef.id,
        ...newServiceHistory
      };
      
      setServiceHistory(prev => [newHistoryItem, ...prev]);
      
      // Refresh customer data from database to ensure UI is in sync
      if (salonId) {
        console.log('DIRECT UPDATE - Refreshing customers list...');
        const result = await getCustomers(salonId, pageSize);
        setCustomers(result.customers);
        setTotalCustomers(result.totalCount);
        setLastDocRef(result.lastDoc);
        setHasNextPage(result.customers.length === pageSize && result.totalCount > pageSize);
        console.log('DIRECT UPDATE - Customers data refreshed');
      }
      
      // Reset and close dialog
      quickServiceForm.reset({
        services: [],
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setSelectedServices([]);
      setIsQuickServiceDialogOpen(false);
      
      // Show success notification
      alert(`${data.services.length > 1 ? 'Services' : 'Service'} recorded for ${selectedCustomer.name}`);
    } catch (error) {
      console.error('Error adding quick service:', error);
      alert(`Failed to record service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleService(service: string) {
    const newSelectedServices = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service];
    
    setSelectedServices(newSelectedServices);
    quickServiceForm.setValue('services', newSelectedServices);
  }

  async function handleCustomerPreview(customer: Customer) {
    if (!customer.id) return;
    
    setPreviewCustomer(customer);
    setIsCustomerPreview(true);
    
    // Load service history for preview
    const history = await loadServiceHistory(customer.id);
    setPreviewHistory(history.slice(0, 3)); // Show only latest 3 services
  }

  function closePreview() {
    setIsCustomerPreview(false);
    setPreviewCustomer(null);
    setPreviewHistory([]);
  }

  function navigateToCustomer(customerId?: string) {
    if (!customerId) return;
    closePreview();
    router.push(`/dashboard/customers/${customerId}`);
  }
  
  const lastServiceDays = (lastVisit: string) => {
    try {
      const visitDate = new Date(lastVisit);
      const today = new Date();
      const days = differenceInDays(today, visitDate);
      return days;
    } catch {
      return 0;
    }
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-gray-500">Manage your salon&apos;s client database</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => router.push('/dashboard/customers/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new customer profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Search, Filter and View Toggle Bar */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search customers by name or phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-2.5 top-2.5" 
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Segmentation Filters */}
          <div className="flex rounded-md overflow-hidden border">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`rounded-none h-10 px-3 ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show all customers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`rounded-none h-10 px-3 ${activeFilter === 'recent' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setActiveFilter('recent')}
                  >
                    Recent
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show customers who visited in the last 7 days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`rounded-none h-10 px-3 ${activeFilter === 'overdue' ? 'bg-primary text-white' : 'bg-transparent'}`}
                    onClick={() => setActiveFilter('overdue')}
                  >
                    Overdue
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Customers who haven&apos;t visited in over 30 days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Service Filter Dropdown */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <select 
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={activeServiceFilter}
                  onChange={(e) => setActiveServiceFilter(e.target.value)}
                >
                  <option value="">All Services</option>
                  {serviceOptions.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter customers by specific service</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* View Mode Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-gray-100 p-1 rounded-md flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Grid View</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>List View</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle between grid and list view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Quick Service Dialog */}
      <Dialog open={isQuickServiceDialogOpen} onOpenChange={setIsQuickServiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Service</DialogTitle>
            <DialogDescription>
              Record a service for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...quickServiceForm}>
            <form onSubmit={quickServiceForm.handleSubmit(addQuickService)} className="space-y-4">
              <FormField
                control={quickServiceForm.control}
                name="services"
                render={() => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                      {availableServices.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <input 
                            type="checkbox"
                            id={`service-${service}`} 
                            checked={selectedServices.includes(service)}
                            onChange={() => toggleService(service)}
                            className="rounded border-gray-300 text-primary h-4 w-4"
                          />
                          <label 
                            htmlFor={`service-${service}`}
                            className="text-sm cursor-pointer"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedServices.length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        Please select at least one service
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={quickServiceForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={quickServiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Special requests or comments" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serviceHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Previous Services</h3>
                  <div className="max-h-40 overflow-y-auto rounded-md p-3 text-sm space-y-2">
                    {serviceHistory.map((history) => {
                      // Get color based on service - use first service if multiple
                      const serviceName = history.serviceArray ? history.serviceArray[0] : history.service;
                      const colorStyle = serviceColors[serviceName] || serviceColors['Other'];
                      
                      return (
                        <div key={history.id} className={`mb-2 pb-2 border-b border-gray-200 last:border-0 ${colorStyle.bg} rounded-md p-2`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`font-medium ${colorStyle.text}`}>{history.service}</span>
                              <div className="text-gray-500 text-xs">
                                {format(new Date(history.date), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                          {history.notes && <div className="text-xs text-gray-600 mt-1">{history.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsQuickServiceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || selectedServices.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Record Service'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Customer Preview Popup */}
      {isCustomerPreview && previewCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">{previewCustomer.name}</h3>
              <button onClick={closePreview}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3 border-b">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-xs font-medium mr-1">+91</span>
                  {previewCustomer.phone}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        {format(new Date(previewCustomer.last_visit), 'MMM d, yyyy')}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatDetailedVisitTime(previewCustomer.last_visit)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Last Service</div>
                <div>
                  {previewCustomer.serviceArray && previewCustomer.serviceArray.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {previewCustomer.serviceArray.map((svc, i) => {
                        const colorStyle = serviceColors[svc] || serviceColors['Other'];
                        return (
                          <Badge key={i} className={`${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border}`} variant="outline">{svc}</Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <Badge variant="outline">{previewCustomer.service}</Badge>
                  )}
                </div>
              </div>
              
              {previewCustomer.notes && (
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Notes</div>
                  <div className="text-sm p-2 bg-gray-50 rounded border border-gray-200">
                    {previewCustomer.notes}
                  </div>
                </div>
              )}
              
              {previewHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Services</h4>
                  <div className="space-y-2">
                    {previewHistory.map((history) => {
                      // Get color based on service - use first service if multiple
                      const serviceName = history.serviceArray ? history.serviceArray[0] : history.service;
                      const colorStyle = serviceColors[serviceName] || serviceColors['Other'];
                      
                      return (
                        <div key={history.id} className={`text-sm p-2 rounded ${colorStyle.bg} border ${colorStyle.border}`}>
                          <div className={`font-medium ${colorStyle.text}`}>{history.service}</div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>{format(new Date(history.date), 'MMM d, yyyy')}</span>
                            {history.notes && <span className="italic">{history.notes}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  closePreview();
                  if (previewCustomer.id) onQuickService(previewCustomer);
                }}
              >
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Record Visit
              </Button>
              <Button 
                onClick={() => navigateToCustomer(previewCustomer.id)}
              >
                View Full Profile
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">No customers yet</h3>
          <p className="text-gray-500 mb-4">
            Add your first customer to get started
          </p>
          <Button 
            variant="outline" 
            onClick={() => setIsQuickServiceDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-white">
          <FilterX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">No matching customers</h3>
          <p className="text-gray-500 mb-4">
            Try changing your search criteria or filters
          </p>
          <div className="flex justify-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
              }}
            >
              Clear Search
            </Button>
            {(activeFilter !== 'all' || activeServiceFilter) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveFilter('all');
                  setActiveServiceFilter('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-md border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Last Service</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const daysSince = formatDaysSince(customer.last_visit);
                
                return (
                  <TableRow 
                    key={customer.id || `customer-${customer.name}-${customer.phone}`} 
                    className="relative cursor-pointer hover:bg-gray-50"
                    onClick={() => handleCustomerPreview(customer)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="bg-primary/10 rounded-full w-8 h-8 mr-3 flex items-center justify-center text-primary font-medium">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <span className="text-base">{customer.name}</span>
                          {customer.notes && (
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                              <span>Has notes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>{formatPhoneDisplay(customer.phone)}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Call or message: +91 {customer.phone}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {customer.serviceArray && customer.serviceArray.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.serviceArray.map((svc, i) => {
                            const colorStyle = serviceColors[svc] || serviceColors['Other'];
                            return (
                              <TooltipProvider key={i}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorStyle.bg} ${colorStyle.text}`}>
                                      {svc}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Filter by {svc} service</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceColors[customer.service]?.bg || 'bg-gray-100'} ${serviceColors[customer.service]?.text || 'text-gray-800'}`}>
                                {customer.service}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Filter by {customer.service} service</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {format(new Date(customer.last_visit), 'MMM d, yyyy')}
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${daysSince.className}`}>
                                {daysSince.text}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatDetailedVisitTime(customer.last_visit)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                      }}
                    >
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!customer.id) {
                                    console.error('Customer ID is missing:', customer);
                                    alert('Error: Cannot record service for this customer');
                                    return;
                                  }
                                  onQuickService(customer);
                                }}
                              >
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                Record Visit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add a new service for this customer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/customers/${customer.id}`);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">View Profile</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View and edit full customer profile</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (customer.id) {
                                    onDeleteCustomer(customer.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete this customer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const daysSince = formatDaysSince(customer.last_visit);
            
            return (
              <Card 
                key={customer.id || `customer-${customer.name}-${customer.phone}`}
                className="cursor-pointer hover:shadow-md transition-shadow border-t-4 border-t-primary"
                onClick={() => handleCustomerPreview(customer)}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary font-medium">
                              {getInitials(customer.name)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Customer: {customer.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div>
                        <h3 className="font-semibold text-base">{customer.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <span className="text-xs font-medium mr-1">+91</span>
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-500">Last Visit</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-end">
                              {format(new Date(customer.last_visit), 'MMM d, yyyy')}
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${daysSince.className}`}>
                                {daysSince.text}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{formatDetailedVisitTime(customer.last_visit)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-600 mb-2 font-medium">Last Service</div>
                    {customer.serviceArray && customer.serviceArray.length > 1 ? (
                      <div className="flex flex-wrap gap-1">
                        {customer.serviceArray.map((svc, i) => {
                          const colorStyle = serviceColors[svc] || serviceColors['Other'];
                          return (
                            <TooltipProvider key={i}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorStyle.bg} ${colorStyle.text}`}>
                                    {svc}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Filter by {svc} service</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceColors[customer.service]?.bg || 'bg-gray-100'} ${serviceColors[customer.service]?.text || 'text-gray-800'}`}>
                              {customer.service}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Filter by {customer.service} service</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {customer.notes && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                        <span>Has notes</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter 
                  className="border-t bg-gray-50 flex items-center pt-3 pb-3" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                  }}
                >
                  <div className="flex space-x-2 mr-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!customer.id) return;
                              onQuickService(customer);
                            }}
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Record Visit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add a new service for this customer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/customers/${customer.id}`);
                            }}
                          >
                            View Profile
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View and edit full customer details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (customer.id) {
                                onDeleteCustomer(customer.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete this customer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {!isLoading && (
        <div className="mt-6 flex flex-col items-center justify-center space-y-4">
          <div className="text-sm text-gray-500">
            Showing {customers.length} of {totalCustomers} customers
          </div>
          
          {hasNextPage && (
            <Button 
              variant="outline" 
              onClick={loadMoreCustomers}
              disabled={isLoadingMore}
              className="w-full max-w-xs"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Load More Customers</>
              )}
            </Button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
} 