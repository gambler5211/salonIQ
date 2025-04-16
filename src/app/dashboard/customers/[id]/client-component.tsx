'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, PlusCircle, Loader2, CalendarClock, Clock, Scissors, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getCustomer, updateCustomer } from '@/lib/db-service';
import { Customer, ServiceHistory } from '@/lib/types';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/dashboard-layout';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Form validation schema
const customerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  notes: z.string().optional(),
});

const serviceHistorySchema = z.object({
  services: z.array(z.string()).min(1, { message: 'Please select at least one service' }),
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)), 
    { message: 'Please enter a valid date' }
  ),
  notes: z.string().optional(),
  price: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type ServiceHistoryFormValues = z.infer<typeof serviceHistorySchema>;

// Services offered (would typically come from a database)
const services = [
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

interface CustomerDetailClientProps {
  customerId: string;
}

export function CustomerDetailClient({ customerId }: CustomerDetailClientProps) {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceHistory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const serviceForm = useForm<ServiceHistoryFormValues>({
    resolver: zodResolver(serviceHistorySchema),
    defaultValues: {
      services: [],
      date: new Date().toISOString().split('T')[0], // Today's date
      notes: '',
      price: '',
    },
  });

  // Handle service selection
  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  useEffect(() => {
    // Update form when selected services change
    serviceForm.setValue('services', selectedServices);
  }, [selectedServices, serviceForm]);

  // Add a function to load service history from Firestore
  async function loadServiceHistory(customerId: string): Promise<ServiceHistory[]> {
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

  useEffect(() => {
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch customer details
    const fetchCustomerDetails = async () => {
      if (salonId && customerId) {
        try {
          const customerData = await getCustomer(customerId);
          if (customerData) {
            setCustomer(customerData);
            form.reset({
              name: customerData.name,
              phone: customerData.phone,
              notes: customerData.notes || '',
            });

            // Load actual service history from the database
            const history = await loadServiceHistory(customerId);
            
            // If no history is found but customer has service info, create one initial entry
            if (history.length === 0 && customerData.service) {
              console.log('No service history found, creating initial entry');
              
              // Create initial history entry
              const initialHistory: Omit<ServiceHistory, 'id'> = {
                customer_id: customerId,
                service: customerData.service,
                date: customerData.last_visit,
                notes: 'Initial visit',
                created_at: customerData.created_at || new Date().toISOString(),
                isMultiService: false,
                serviceArray: [customerData.service]
              };
              
              try {
                // Add to Firestore
                const historyRef = await addDoc(collection(db, 'service_history'), initialHistory);
                
                // Add to local state with the new ID
                setServiceHistory([{
                  id: historyRef.id,
                  ...initialHistory
                }]);
                
                console.log('Created initial service history entry:', historyRef.id);
              } catch (err) {
                console.error('Error creating initial service history:', err);
                // Fallback to showing local version
                setServiceHistory([{
                  id: 'initial-local',
                  ...initialHistory
                }]);
              }
            } else {
              // Use the history loaded from the database
              setServiceHistory(history);
            }
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
          setErrorMessage('Failed to load customer details');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCustomerDetails();
  }, [user, salonId, loading, router, customerId, form]);

  async function onUpdateCustomer(data: CustomerFormValues) {
    if (!salonId || !customer?.id) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateCustomer({
        id: customer.id,
        ...data,
        // Preserve other fields
        service: customer.service,
        last_visit: customer.last_visit,
        salon_id: salonId,
        notes: data.notes || '',
      });

      // Update local state
      setCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...data
        };
      });

      // Show success message
      alert('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      setErrorMessage('Failed to update customer details');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onAddServiceHistory(data: ServiceHistoryFormValues) {
    if (!salonId || !customer?.id) return;

    setIsSubmitting(true);
    try {
      // Step 1: Create the service history entry first
      const newServiceData: Omit<ServiceHistory, 'id'> = {
        customer_id: customer.id,
        service: data.services.join(', '), // Join multiple services with comma
        date: data.date,
        notes: data.notes || '',
        price: data.price || '',
        created_at: new Date().toISOString(),
        isMultiService: data.services.length > 1, // Flag for multiple services
        serviceArray: data.services // Store original array for filtering
      };

      // Save to Firestore
      const historyRef = await addDoc(collection(db, 'service_history'), newServiceData);
      console.log('Added service history with ID:', historyRef.id);
      
      // Add to local service history
      const newService: ServiceHistory = {
        id: historyRef.id,
        ...newServiceData
      };
      
      // Update service history state
      setServiceHistory(prev => [newService, ...prev]);

      // Step 2: Update the customer's last service and visit date
      const primaryService = data.services[0];
      const customerRef = doc(db, 'customers', customer.id);
      
      // Only update last service and visit date
      await setDoc(customerRef, {
        service: primaryService,
        serviceArray: data.services,
        isMultiService: data.services.length > 1,
        last_visit: data.date
      }, { merge: true });
      
      // Update local customer state
      setCustomer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          service: primaryService,
          serviceArray: data.services,
          isMultiService: data.services.length > 1,
          last_visit: data.date
        };
      });

      // Reset form and close dialog
      serviceForm.reset({
        services: [],
        date: new Date().toISOString().split('T')[0],
        notes: '',
        price: '',
      });
      setSelectedServices([]);
      setIsAddServiceDialogOpen(false);
      
      // Show success message
      alert('Service recorded successfully');
    } catch (error) {
      console.error('Error adding service history:', error);
      alert('Failed to record service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Add function to delete service history entry
  async function deleteServiceHistory(service: ServiceHistory) {
    if (!service.id || service.id === 'initial-local') {
      alert('Cannot delete this service history entry');
      return;
    }

    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDeleteService() {
    if (!serviceToDelete || !serviceToDelete.id) return;

    setIsDeletingService(true);
    try {
      // Delete from Firestore
      const historyDocRef = doc(db, 'service_history', serviceToDelete.id);
      await deleteDoc(historyDocRef);
      
      // Remove from local state
      setServiceHistory(prev => prev.filter(item => item.id !== serviceToDelete.id));
      
      // If this is the newest service, update the customer record with the next newest service
      const remainingHistory = serviceHistory.filter(item => item.id !== serviceToDelete.id);
      
      if (remainingHistory.length > 0 && customer && customer.service === serviceToDelete.service) {
        // Get the next newest service
        const newestService = remainingHistory[0];
        
        // Update customer record
        const customerRef = doc(db, 'customers', customerId);
        await setDoc(customerRef, {
          service: newestService.serviceArray?.[0] || newestService.service,
          serviceArray: newestService.serviceArray || [newestService.service],
          isMultiService: newestService.isMultiService || false,
          last_visit: newestService.date
        }, { merge: true });
        
        // Update local customer state
        setCustomer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            service: newestService.serviceArray?.[0] || newestService.service,
            serviceArray: newestService.serviceArray || [newestService.service],
            isMultiService: newestService.isMultiService || false,
            last_visit: newestService.date
          };
        });
      }
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      alert('Service history entry deleted successfully');
    } catch (error) {
      console.error('Error deleting service history:', error);
      alert('Failed to delete service history. Please try again.');
    } finally {
      setIsDeletingService(false);
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading customer details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/customers')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Customer Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>The requested customer could not be found.</p>
            <Button 
              onClick={() => router.push('/dashboard/customers')}
              className="mt-4"
            >
              Return to Customers
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard/customers')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Customer Details</TabsTrigger>
          <TabsTrigger value="services">Service History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Update customer contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onUpdateCustomer)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Any additional information about the customer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Last Visit Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Service</p>
                        <p className="font-medium">{customer.service}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date</p>
                        <p className="font-medium">{format(new Date(customer.last_visit), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Information
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Service History</h2>
            <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>
                    Record a new service for {customer.name}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...serviceForm}>
                  <form onSubmit={serviceForm.handleSubmit(onAddServiceHistory)} className="space-y-4">
                    <FormField
                      control={serviceForm.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <FormLabel>Services</FormLabel>
                          <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
                            {services.map((service) => (
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
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={serviceForm.control}
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
                      control={serviceForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Price (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="$50.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={serviceForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Special requests or comments" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddServiceDialogOpen(false)}
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
                        ) : (
                          'Add Service'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {serviceHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-6">
                  <Scissors className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No service history yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start tracking this customer&apos;s services by adding their first visit
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddServiceDialogOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add First Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviceHistory.map((service) => (
                <Card key={service.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* If it's a multi-service entry, split and render each as a badge */}
                          {service.isMultiService && service.serviceArray ? (
                            service.serviceArray.map((svc, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 text-gray-700">
                                {svc}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-200 text-gray-700">
                              {service.service}
                            </span>
                          )}
                          <span className="text-gray-500 text-sm flex items-center">
                            <CalendarClock className="h-3 w-3 mr-1" />
                            {format(new Date(service.date), 'MMM d, yyyy')}
                          </span>
                          {service.price && (
                            <span className="text-gray-500 text-sm">${service.price}</span>
                          )}
                        </div>
                        {service.notes && (
                          <p className="text-gray-700 text-sm mt-1">{service.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-gray-400 text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(service.created_at), 'MMM d, yyyy')}
                        </div>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                          onClick={() => deleteServiceHistory(service)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Service Deletion */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service history entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-3 rounded-md my-2 text-sm">
            <div className="font-medium">{serviceToDelete?.service}</div>
            <div className="text-gray-500">
              {serviceToDelete?.date && format(new Date(serviceToDelete.date), 'MMMM d, yyyy')}
            </div>
            {serviceToDelete?.notes && (
              <div className="mt-1 text-gray-600">{serviceToDelete.notes}</div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingService}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              disabled={isDeletingService}
              onClick={confirmDeleteService}
            >
              {isDeletingService ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Service'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 