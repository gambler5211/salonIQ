'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getTemplates, addCampaign } from '@/lib/db-service';
import { Template } from '@/lib/types';
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
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { SafeSelectItem } from '@/components/ui/safe-select-item';

// Form validation schema
const campaignSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  template_id: z.string().min(1, { message: 'Please select a template' }),
  days_since_visit: z.coerce.number().min(1, { message: 'Must be at least 1 day' }).max(365, { message: 'Too many days' }),
  service_filter: z.string().optional(),
  active: z.boolean().default(true),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      template_id: '',
      days_since_visit: 30,
      service_filter: '',
      active: true,
    },
  });

  useEffect(() => {
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch templates
    const fetchData = async () => {
      if (salonId) {
        try {
          const templatesData = await getTemplates(salonId);
          
          // Ensure all templates have a valid ID
          const processedTemplates = templatesData.map(template => {
            if (!template.id) {
              // Add a temporary ID for templates that don't have one
              return { ...template, id: `temp-${Math.random().toString(36).substring(2)}` };
            }
            return template;
          });
          
          setTemplates(processedTemplates);
        } catch (error) {
          console.error('Error fetching templates:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, salonId, loading, router]);

  async function onCreateCampaign(data: CampaignFormValues) {
    if (!salonId) return;

    setIsSubmitting(true);
    try {
      await addCampaign({
        ...data,
        salon_id: salonId,
      });

      // Navigate back to campaigns page
      router.push('/dashboard/campaigns');
    } catch (error) {
      console.error('Error adding campaign:', error);
      // Reset submission state on error
      setIsSubmitting(false);
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/campaigns')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
        <p className="text-gray-500">Set up when and how to send reminders to your clients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateCampaign)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Haircut Follow-up" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Template</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.length === 0 ? (
                          <SafeSelectItem value="no-templates" disabled>
                            No templates available
                          </SafeSelectItem>
                        ) : (
                          templates.map((template) => (
                            <SafeSelectItem 
                              key={template.id} 
                              value={template.id}
                            >
                              {template.name}
                            </SafeSelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The template used for reminder messages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="days_since_visit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days Since Last Visit</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={365} {...field} />
                    </FormControl>
                    <FormDescription>
                      Send reminders to clients who visited this many days ago
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="service_filter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filter by Service (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All services" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SafeSelectItem value="">All services</SafeSelectItem>
                        <SafeSelectItem value="Haircut">Haircut</SafeSelectItem>
                        <SafeSelectItem value="Color">Color</SafeSelectItem>
                        <SafeSelectItem value="Blowout">Blowout</SafeSelectItem>
                        <SafeSelectItem value="Styling">Styling</SafeSelectItem>
                        <SafeSelectItem value="Perm">Perm</SafeSelectItem>
                        <SafeSelectItem value="Treatment">Treatment</SafeSelectItem>
                        <SafeSelectItem value="Manicure">Manicure</SafeSelectItem>
                        <SafeSelectItem value="Pedicure">Pedicure</SafeSelectItem>
                        <SafeSelectItem value="Facial">Facial</SafeSelectItem>
                        <SafeSelectItem value="Massage">Massage</SafeSelectItem>
                        <SafeSelectItem value="Waxing">Waxing</SafeSelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only send to clients who received this service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Campaign</FormLabel>
                      <FormDescription>
                        Campaign will send reminders automatically
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/campaigns')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || templates.length === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
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