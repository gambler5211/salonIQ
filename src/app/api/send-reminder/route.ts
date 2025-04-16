import { NextRequest, NextResponse } from 'next/server';
import { 
  getCampaign, 
  getDueCustomers,
  getTemplate, 
  getSalon,
  updateCampaign
} from '@/lib/db-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';

export async function POST(request: NextRequest) {
  try {
    const { campaignId, salonId } = await request.json();
    
    if (!campaignId || !salonId) {
      return NextResponse.json(
        { error: 'Campaign ID and Salon ID are required' },
        { status: 400 }
      );
    }
    
    // Get the campaign
    const campaign = await getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Make sure the campaign belongs to the salon
    if (campaign.salon_id !== salonId) {
      return NextResponse.json(
        { error: 'Unauthorized access to campaign' },
        { status: 403 }
      );
    }
    
    // Get the template
    const template = await getTemplate(campaign.template_id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Get salon details for WhatsApp API
    const salon = await getSalon(salonId);
    if (!salon) {
      return NextResponse.json(
        { error: 'Salon not found' },
        { status: 404 }
      );
    }
    
    // Check if WhatsApp API is configured
    if (!salon.whatsapp_access_token || !salon.whatsapp_phone_number_id) {
      return NextResponse.json(
        { error: 'WhatsApp API not configured' },
        { status: 400 }
      );
    }
    
    // Get customers due for reminders
    const dueCustomers = await getDueCustomers(campaign, salonId);
    
    if (dueCustomers.length === 0) {
      return NextResponse.json(
        { message: 'No customers due for reminders' },
        { status: 200 }
      );
    }
    
    // Send WhatsApp messages
    const results = await Promise.all(
      dueCustomers.map(async (customer) => {
        try {
          const success = await sendWhatsAppMessage(
            customer,
            template.content,
            'appointment_reminder', // WhatsApp template name (must be approved in WhatsApp Business Manager)
            salon
          );
          
          return {
            customerId: customer.id,
            name: customer.name,
            phone: customer.phone,
            success
          };
        } catch (error) {
          console.error(`Error sending reminder to ${customer.name}:`, error);
          return {
            customerId: customer.id,
            name: customer.name,
            phone: customer.phone,
            success: false,
            error: (error as Error).message
          };
        }
      })
    );
    
    // Update campaign with last run timestamp
    await updateCampaign(campaignId, {
      last_run: new Date().toISOString()
    });
    
    // Return results
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      message: `Sent ${successCount} of ${dueCustomers.length} reminders`,
      results
    });
    
  } catch (error) {
    console.error('Error in send-reminder API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 