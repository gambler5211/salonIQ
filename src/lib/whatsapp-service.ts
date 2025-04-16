import axios from 'axios';
import { Customer, Salon } from './types';

export interface WhatsAppTemplateMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components: {
      type: string;
      parameters: {
        type: string;
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }[];
    }[];
  };
}

export async function sendWhatsAppMessage(
  customer: Customer, 
  templateContent: string,
  templateName: string,
  salon: Salon
): Promise<boolean> {
  if (!salon.whatsapp_access_token || !salon.whatsapp_phone_number_id) {
    throw new Error('WhatsApp API credentials not set');
  }

  try {
    // Format phone number to comply with WhatsApp API requirements
    const formattedPhoneNumber = formatPhoneNumber(customer.phone);
    
    // Prepare variables
    const variables = parseTemplateVariables(templateContent, customer, salon);
    
    // Create message payload
    const message: WhatsAppTemplateMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US"
        },
        components: [
          {
            type: "body",
            parameters: variables.map(variable => ({
              type: "text",
              text: variable
            }))
          }
        ]
      }
    };

    // Send message
    const response = await axios.post(
      `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${salon.whatsapp_phone_number_id}/messages`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${salon.whatsapp_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Helper to format phone number for WhatsApp API
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Ensure it has country code
  if (digits.startsWith('1')) {
    return digits;
  } else {
    // Default to US/Canada country code if none provided
    return `1${digits}`;
  }
}

// Parse template variables and replace them with actual values
function parseTemplateVariables(
  template: string, 
  customer: Customer, 
  salon: Salon
): string[] {
  // Extract variables from template content (e.g., {{name}}, {{service}})
  const variables: string[] = [];
  
  // Replace {{name}} with customer.name
  if (template.includes('{{name}}')) {
    variables.push(customer.name);
  }
  
  // Replace {{service}} with customer.service
  if (template.includes('{{service}}')) {
    variables.push(customer.service);
  }
  
  // Replace {{salon}} with salon.salonName
  if (template.includes('{{salon}}')) {
    variables.push(salon.salonName);
  }
  
  return variables;
} 