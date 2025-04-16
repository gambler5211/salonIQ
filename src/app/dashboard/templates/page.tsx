'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2, Edit, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getTemplates, addTemplate, deleteTemplate } from '@/lib/db-service';
import { Template } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

// Form validation schema
const templateSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  content: z.string().min(10, { message: 'Message content too short' }).max(1000, { message: 'Message is too long' }),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function TemplatesPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      content: 'Hi {{name}}, it\'s time for your next {{service}} at {{salon}}! Book now and get 10% off.',
    },
  });

  useEffect(() => {
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch templates
    const fetchTemplates = async () => {
      if (salonId) {
        try {
          const templates = await getTemplates(salonId);
          setTemplates(templates);
        } catch (error) {
          console.error('Error fetching templates:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTemplates();
  }, [user, salonId, loading, router]);

  // Extract variables like {{name}} from template content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{{([^}]+)}}/g) || [];
    return matches.map(match => match.slice(2, -2));
  };

  async function onAddTemplate(data: TemplateFormValues) {
    if (!salonId) return;

    setIsSubmitting(true);
    try {
      // Extract variables from content
      const variables = extractVariables(data.content);

      const id = await addTemplate({
        ...data,
        variables,
        salon_id: salonId,
      });

      // Add the new template to the list
      setTemplates((prev) => [
        ...prev,
        {
          id,
          ...data,
          variables,
          salon_id: salonId,
          created_at: new Date().toISOString(),
        },
      ]);

      // Reset form and close dialog
      form.reset();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding template:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDeleteTemplate(id: string) {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((template) => template.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  function openPreview(template: Template) {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading templates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-gray-500">Create WhatsApp message templates for your campaigns</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Message Template</DialogTitle>
              <DialogDescription>
                Create a template for your WhatsApp messages. Use variables like {'{{name}}'}, {'{{service}}'}, and {'{{salon}}'}.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddTemplate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Follow-up Reminder" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your message template" 
                          className="min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Use {'{{name}}'}, {'{{service}}'}, and {'{{salon}}'} as variables.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Template'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              This is how your message will look like with sample data.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">WhatsApp Message Preview</h3>
              <div className="bg-green-100 p-3 rounded-lg relative max-w-xs">
                {previewTemplate && (
                  <div className="text-sm whitespace-pre-wrap">
                    {previewTemplate.content
                      .replace(/\{\{name\}\}/g, 'Jane Smith')
                      .replace(/\{\{service\}\}/g, 'Haircut')
                      .replace(/\{\{salon\}\}/g, 'Beauty Salon')}
                  </div>
                )}
                <div className="text-xs text-gray-500 text-right mt-1">
                  10:30 AM
                </div>
              </div>
            </div>
            {previewTemplate && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Variables detected:</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.variables.map((variable) => (
                    <span 
                      key={variable} 
                      className="bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {templates.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-white">
          <h3 className="text-lg font-medium mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first WhatsApp message template
          </p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openPreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Preview</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => template.id && onDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.content}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span 
                        key={variable} 
                        className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
} 