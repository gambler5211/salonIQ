'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { addCustomer } from '@/lib/db-service';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Form validation schema
const customerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string()
    .length(10, { message: 'Indian mobile numbers must be 10 digits' })
    .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid Indian mobile number (must start with 6, 7, 8, or 9)' }),
  services: z.array(z.string()).min(1, { message: 'Please select at least one service' }),
  last_visit: z.string().refine(
    (date) => !isNaN(Date.parse(date)), 
    { message: 'Please enter a valid date' }
  ),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

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

// Phone input component with formatting for Indian numbers
function PhoneInput({ value, onChange, placeholder, ...props }: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    const cleaned = input.replace(/\D/g, '');
    
    // Format the Indian phone number with +91 prefix
    let formatted = cleaned;
    if (cleaned.length > 0) {
      if (cleaned.length <= 10) {
        formatted = cleaned;
      } else {
        // Only keep the last 10 digits if more are entered
        formatted = cleaned.slice(-10);
      }
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="relative">
      <div className="absolute left-2.5 top-2.5 flex items-center text-gray-500">
        <Phone className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">+91</span>
      </div>
      <Input
        type="tel"
        value={value}
        onChange={handleChange}
        className="pl-16"
        placeholder={placeholder || "9876543210"}
        maxLength={10} // Indian mobile numbers are 10 digits
        {...props}
      />
    </div>
  );
}

export default function NewCustomerPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      services: [],
      last_visit: new Date().toISOString().split('T')[0], // Today's date
      notes: '',
    },
  });

  function toggleService(service: string) {
    const newSelectedServices = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service];
    
    setSelectedServices(newSelectedServices);
    form.setValue('services', newSelectedServices);
  }

  async function onSubmit(data: CustomerFormValues) {
    if (!salonId) {
      setErrorMessage('You must be logged in to add customers');
      return;
    }

    if (data.services.length === 0) {
      setErrorMessage('Please select at least one service');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Create customer object with all required fields
      const customerData = {
        name: data.name,
        phone: data.phone,
        service: data.services[0], // Set the primary service as first selected service
        serviceArray: data.services,
        isMultiService: data.services.length > 1,
        last_visit: data.last_visit,
        salon_id: salonId,
        notes: data.notes || '',
        created_at: new Date().toISOString(),
      };

      // Add the customer to the database
      await addCustomer(customerData);

      // Redirect back to customers list
      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Error adding customer:', error);
      setErrorMessage('Failed to add customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/login');
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
        <h1 className="text-3xl font-bold tracking-tight">Add New Customer</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Add a new customer to your salon database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {errorMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
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
                      <PhoneInput 
                        {...field}
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        placeholder="9876543210"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a phone number that can receive WhatsApp messages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <FormLabel>Services</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-4">
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
                    {selectedServices.length === 0 && form.formState.isSubmitted && (
                      <p className="text-sm text-destructive mt-1">
                        Please select at least one service
                      </p>
                    )}
                    {selectedServices.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Selected services:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedServices.map(service => {
                            const colorStyle = serviceColors[service] || serviceColors['Other'];
                            return (
                              <Badge 
                                key={service} 
                                className={`${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border}`}
                                variant="outline"
                              >
                                {service}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <FormDescription>
                      Select all services this customer received
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_visit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Visit Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      When the customer last visited your salon
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about the customer..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Customer preferences, special requirements, or other notes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/dashboard/customers')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Customer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
} 