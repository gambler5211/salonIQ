'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getSalon, updateSalon } from '@/lib/db-service';
import { Salon } from '@/lib/types';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Form validation schema
const whatsappSchema = z.object({
  whatsapp_access_token: z.string().min(1, { message: 'Access token is required' }),
  whatsapp_phone_number_id: z.string().min(1, { message: 'Phone number ID is required' }),
  whatsapp_business_id: z.string().optional(),
});

type WhatsAppFormValues = z.infer<typeof whatsappSchema>;

export default function SettingsPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm<WhatsAppFormValues>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      whatsapp_access_token: '',
      whatsapp_phone_number_id: '',
      whatsapp_business_id: '',
    },
  });

  useEffect(() => {
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch salon data
    const fetchSalon = async () => {
      if (salonId) {
        try {
          const salonData = await getSalon(salonId);
          setSalon(salonData);

          if (salonData) {
            // Set form values
            form.reset({
              whatsapp_access_token: salonData.whatsapp_access_token || '',
              whatsapp_phone_number_id: salonData.whatsapp_phone_number_id || '',
              whatsapp_business_id: salonData.whatsapp_business_id || '',
            });
          }
        } catch (error) {
          console.error('Error fetching salon data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSalon();
  }, [user, salonId, loading, router, form]);

  async function onSaveWhatsAppSettings(data: WhatsAppFormValues) {
    if (!salonId) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSalon(salonId, data);
      setSaveSuccess(true);
      
      // Update local state
      setSalon((prev) => {
        if (!prev) return null;
        return { ...prev, ...data };
      });
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">Configure your salon retargeting settings</p>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp API</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="whatsapp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API Configuration</CardTitle>
              <CardDescription>
                Connect your WhatsApp Business account to send appointment reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-amber-800 mb-1">Important</h3>
                <p className="text-sm text-amber-700">
                  You&apos;ll need to create approved message templates in your WhatsApp Business Manager account before sending messages.
                  Learn more in the <a href="https://developers.facebook.com/docs/whatsapp/api/messages/message-templates" target="_blank" rel="noopener noreferrer" className="underline">WhatsApp API Documentation</a>.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSaveWhatsAppSettings)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="whatsapp_access_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Access Token</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your access token" 
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The permanent access token from your WhatsApp Business API settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="whatsapp_phone_number_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your phone number ID" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The WhatsApp phone number ID from your Meta developer dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="whatsapp_business_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Account ID (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your business ID" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your WhatsApp Business account ID (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    {saveSuccess && (
                      <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 text-sm">
                        WhatsApp settings saved successfully!
                      </div>
                    )}
                    
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your salon account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Salon Name</h3>
                  <p className="text-gray-600">{salon?.salonName || 'Not set'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Email</h3>
                  <p className="text-gray-600">{salon?.email || 'Not set'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Account Created</h3>
                  <p className="text-gray-600">
                    {salon?.createdAt 
                      ? new Date(salon.createdAt).toLocaleDateString() 
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
} 