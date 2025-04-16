import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import { Customer, Salon, Template, Campaign } from './types';

// Customers
export async function getCustomers(
  salonId: string, 
  pageSize: number = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ customers: Customer[], lastDoc: QueryDocumentSnapshot<DocumentData> | null, totalCount: number }> {
  // First get the total count for pagination info
  const countQuery = query(
    collection(db, 'customers'),
    where('salon_id', '==', salonId)
  );
  const countSnapshot = await getCountFromServer(countQuery);
  const totalCount = countSnapshot.data().count;
  
  // Build query with pagination
  let customerQuery;
  if (lastDoc) {
    customerQuery = query(
      collection(db, 'customers'),
      where('salon_id', '==', salonId),
      orderBy('name'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  } else {
    customerQuery = query(
      collection(db, 'customers'),
      where('salon_id', '==', salonId),
      orderBy('name'),
      limit(pageSize)
    );
  }
  
  const snapshot = await getDocs(customerQuery);
  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  
  // Convert snapshots to Customer objects with data transformation
  const customers = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Customer[];
  
  return { 
    customers, 
    lastDoc: lastVisible,
    totalCount
  };
}

// For backwards compatibility
export async function getAllCustomers(salonId: string): Promise<Customer[]> {
  const q = query(
    collection(db, 'customers'),
    where('salon_id', '==', salonId),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() 
  })) as Customer[];
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  try {
    const docRef = doc(db, 'customers', customerId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Customer;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
  try {
    console.log('Adding customer to database:', customer);
    
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      // If created_at not provided, add it
      created_at: customer.created_at || new Date().toISOString()
    });
    
    console.log('Customer added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add customer:', error);
    throw error; // Re-throw to allow proper handling in the UI
  }
}

export async function updateCustomer(customer: Customer): Promise<boolean> {
  try {
    if (!customer.id) {
      console.error('Customer ID is required for update');
      throw new Error('Customer ID is required for update');
    }
    
    console.log('Updating customer in database:', customer);
    
    const docRef = doc(db, 'customers', customer.id);
    
    // Create an update object with only defined properties
    const updateData: Partial<Customer> = {};
    
    if (customer.name) updateData.name = customer.name;
    if (customer.phone) updateData.phone = customer.phone;
    if (customer.service) updateData.service = customer.service;
    if (customer.last_visit) updateData.last_visit = customer.last_visit;
    if (customer.salon_id) updateData.salon_id = customer.salon_id;
    
    console.log('Update data:', updateData);
    
    await updateDoc(docRef, updateData);
    
    console.log('Customer updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating customer:', error);
    return false;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const docRef = doc(db, 'customers', id);
  await deleteDoc(docRef);
}

// Salon
export async function getSalon(salonId: string): Promise<Salon | null> {
  const docRef = doc(db, 'salons', salonId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Salon;
}

export async function updateSalon(salonId: string, data: Partial<Salon>): Promise<void> {
  const docRef = doc(db, 'salons', salonId);
  await updateDoc(docRef, data);
}

// Templates
export async function getTemplates(salonId: string): Promise<Template[]> {
  const q = query(
    collection(db, 'templates'),
    where('salon_id', '==', salonId),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() 
  })) as Template[];
}

export async function getTemplate(id: string): Promise<Template | null> {
  const docRef = doc(db, 'templates', id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Template;
}

export async function addTemplate(template: Omit<Template, 'id' | 'created_at'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'templates'), {
    ...template,
    created_at: new Date().toISOString()
  });
  
  return docRef.id;
}

export async function updateTemplate(id: string, template: Partial<Template>): Promise<void> {
  const docRef = doc(db, 'templates', id);
  await updateDoc(docRef, template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const docRef = doc(db, 'templates', id);
  await deleteDoc(docRef);
}

// Campaigns
export async function getCampaigns(salonId: string): Promise<Campaign[]> {
  const q = query(
    collection(db, 'campaigns'),
    where('salon_id', '==', salonId),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() 
  })) as Campaign[];
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const docRef = doc(db, 'campaigns', id);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Campaign;
}

export async function addCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'campaigns'), {
    ...campaign,
    created_at: new Date().toISOString()
  });
  
  return docRef.id;
}

export async function updateCampaign(id: string, campaign: Partial<Campaign>): Promise<void> {
  const docRef = doc(db, 'campaigns', id);
  await updateDoc(docRef, campaign);
}

export async function deleteCampaign(id: string): Promise<void> {
  const docRef = doc(db, 'campaigns', id);
  await deleteDoc(docRef);
}

// Get customers due for follow-up based on a campaign
export async function getDueCustomers(campaign: Campaign, salonId: string): Promise<Customer[]> {
  // Get all customers for the salon - use getAllCustomers instead of getCustomers
  const customers = await getAllCustomers(salonId);
  
  // Calculate the date threshold based on days_since_visit
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(now.getDate() - campaign.days_since_visit);
  
  // Filter customers who are due for a follow-up
  return customers.filter(customer => {
    // Apply service filter if it exists
    if (campaign.service_filter && customer.service !== campaign.service_filter) {
      return false;
    }
    
    // Check if the last visit date is before the threshold date
    const lastVisitDate = new Date(customer.last_visit);
    return lastVisitDate <= thresholdDate && lastVisitDate > new Date(0);
  });
} 