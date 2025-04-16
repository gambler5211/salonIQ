'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getCampaigns, getTemplates, addCampaign, updateCampaign, deleteCampaign } from '@/lib/db-service';
import { Campaign, Template } from '@/lib/types';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// Form validation schema
const campaignSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  template_id: z.string().min(1, { message: 'Please select a template' }),
  days_since_visit: z.coerce.number().min(1, { message: 'Must be at least 1 day' }).max(365, { message: 'Too many days' }),
  service_filter: z.string().optional(),
  active: z.boolean().default(true),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<CampaignFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(campaignSchema) as any,
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

    // Fetch campaigns and templates
    const fetchData = async () => {
      if (salonId) {
        try {
          const [campaignsData, templatesData] = await Promise.all([
            getCampaigns(salonId),
            getTemplates(salonId),
          ]);
          
          // Ensure all templates have a valid ID 
          const processedTemplates = templatesData.map(template => {
            if (!template.id) {
              // Add a temporary ID for templates that don't have one
              return { ...template, id: `temp-${Math.random().toString(36).substring(2)}` };
            }
            return template;
          });
          
          setCampaigns(campaignsData);
          setTemplates(processedTemplates);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, salonId, loading, router]);

  async function onAddCampaign(data: CampaignFormValues) {
    if (!salonId) return;

    setIsSubmitting(true);
    try {
      const id = await addCampaign({
        ...data,
        salon_id: salonId,
      });

      // Add the new campaign to the list
      setCampaigns((prev) => [
        ...prev,
        {
          id,
          ...data,
          salon_id: salonId,
          created_at: new Date().toISOString(),
        },
      ]);

      // Reset form and close dialog
      form.reset();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDeleteCampaign(id: string) {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  }

  async function toggleCampaignStatus(id: string, currentActive: boolean) {
    try {
      await updateCampaign(id, { active: !currentActive });
      setCampaigns((prev) => 
        prev.map((campaign) => 
          campaign.id === id 
            ? { ...campaign, active: !currentActive } 
            : campaign
        )
      );
    } catch (error) {
      console.error('Error toggling campaign status:', error);
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading campaigns...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-gray-500">Create and manage your reminder campaigns</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Reminder Campaign</DialogTitle>
              <DialogDescription>
                Set up when and how to send reminders to your clients
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onSubmit={form.handleSubmit(onAddCampaign as any)} 
                className="space-y-4"
              >
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="30-day follow-up" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name="template_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Template</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SafeSelectItem key={template.id} value={template.id!}>
                              {template.name}
                            </SafeSelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a message template to use for this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name="days_since_visit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days Since Last Visit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          max={365}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || '')}
                        />
                      </FormControl>
                      <FormDescription>
                        Send reminder when it&apos;s been this many days since client&apos;s last visit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name="service_filter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Filter (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Haircut, Color, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        Only target clients who received this service
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  control={form.control as any}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <FormDescription>
                          Enable or disable this campaign
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
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Campaign'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* No templates warning */}
      {templates.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium mb-1">No message templates found</h3>
          <p className="text-sm">
            You need to create message templates before setting up campaigns.{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium text-amber-800 underline"
              onClick={() => router.push('/dashboard/templates')}
            >
              Create templates
            </Button>
          </p>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first reminder campaign
          </p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddDialogOpen(true)}
            disabled={templates.length === 0}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Campaign
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            // Find the template for this campaign
            const template = templates.find(t => t.id === campaign.template_id);
            
            return (
              <Card key={campaign.id} className={`overflow-hidden ${!campaign.active ? 'opacity-70' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>
                        {campaign.service_filter ? `For ${campaign.service_filter} clients` : 'All services'}
                      </CardDescription>
                    </div>
                    <Switch 
                      checked={campaign.active} 
                      onCheckedChange={() => campaign.id && toggleCampaignStatus(campaign.id, campaign.active)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Template:</span>{' '}
                      <span className="text-sm text-gray-600">{template?.name || 'Unknown template'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Timing:</span>{' '}
                      <span className="text-sm text-gray-600">{campaign.days_since_visit} days after visit</span>
                    </div>
                    {campaign.last_run && (
                      <div>
                        <span className="text-sm font-medium">Last run:</span>{' '}
                        <span className="text-sm text-gray-600">
                          {format(new Date(campaign.last_run), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-3 px-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => campaign.id && router.push(`/dashboard/campaigns/${campaign.id}`)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => campaign.id && onDeleteCampaign(campaign.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
} 