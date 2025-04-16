import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  service: string;
  serviceArray?: string[]; // Array of services for multi-service entries
  isMultiService?: boolean; // Flag to indicate if this customer received multiple services
  last_visit: string; // ISO date string
  salon_id: string;
  notes?: string; // Customer notes
  created_at?: string;
  updated_at?: Timestamp | null; // Firebase server timestamp
}

export interface Salon {
  id?: string;
  salonName: string;
  email: string;
  whatsapp_access_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_id?: string;
  createdAt?: string;
}

export interface Template {
  id?: string;
  name: string;
  content: string;
  variables: string[]; 
  salon_id: string;
  created_at?: string;
}

export interface Campaign {
  id?: string;
  name: string;
  template_id: string;
  service_filter?: string;
  days_since_visit: number;
  salon_id: string;
  active: boolean;
  created_at?: string;
  last_run?: string;
}

export interface ServiceHistory {
  id: string;
  customer_id: string;
  service: string;
  date: string; // ISO date string
  notes?: string;
  price?: string;
  created_at: string;
  isMultiService?: boolean;
  serviceArray?: string[];
} 