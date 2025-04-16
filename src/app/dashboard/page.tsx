'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Users, MessageSquare, PlusCircle, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { getAllCustomers, getCampaigns } from '@/lib/db-service';
import DashboardLayout from '@/components/layout/dashboard-layout';

// Simple counter animation hook
const useCountAnimation = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (end > 0) {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = timestamp - startTimeRef.current;
        const percentage = Math.min(progress / duration, 1);
        
        countRef.current = Math.floor(percentage * end);
        setCount(countRef.current);
        
        if (percentage < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setCount(end); // Ensure final value is exact
        }
      };
      
      frameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);
  
  return count;
};

export default function DashboardPage() {
  const { user, salonId, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    campaigns: 0,
    messageSent: 0,
    customerDue: 0,
  });
  
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);
  const animatedCustomers = useCountAnimation(isStatsLoaded ? stats.totalCustomers : 0);
  const animatedCampaigns = useCountAnimation(isStatsLoaded ? stats.campaigns : 0);
  const animatedMessages = useCountAnimation(isStatsLoaded ? stats.messageSent : 0);
  const animatedDue = useCountAnimation(isStatsLoaded ? stats.customerDue : 0);

  useEffect(() => {
    // Redirect if not logged in and not loading
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Fetch dashboard stats
    const fetchData = async () => {
      if (salonId) {
        try {
          // Get customers
          const customers = await getAllCustomers(salonId);
          
          // Get campaigns
          const campaigns = await getCampaigns(salonId);
          
          // Calculate customers due for follow-up based on campaign criteria and last visit
          const now = new Date();
          let customersDue = 0;
          
          customers.forEach(customer => {
            const lastVisitDate = new Date(customer.last_visit);
            const daysSinceLastVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Consider customers due if they haven't visited in more than 30 days
            if (daysSinceLastVisit > 30) {
              customersDue++;
            }
          });
          
          // Set stats
          setStats({
            totalCustomers: customers.length,
            campaigns: campaigns.filter(campaign => campaign.active).length,
            // This would come from a real stats system, mocked for now
            messageSent: campaigns.reduce((total, campaign) => (campaign.last_run ? total + Math.floor(Math.random() * 5) + 1 : total), 0),
            customerDue: customersDue,
          });
          
          // Delay setting isStatsLoaded to true to ensure animation starts after render
          setTimeout(() => {
            setIsStatsLoaded(true);
          }, 200);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      }
    };

    fetchData();
  }, [user, salonId, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {/* Total Customers Card */}
        <div 
          className="cursor-pointer hover:scale-105 transition-all duration-200 group"
          onClick={() => router.push('/dashboard/customers')}
        >
          <Card className="border rounded-lg shadow-sm hover:shadow transition-all bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <div className="h-6 w-6 text-gray-400">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{animatedCustomers}</div>
              <p className="text-xs text-gray-500">
                Clients in your database
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns Card */}
        <Card className="border rounded-lg shadow-sm hover:shadow transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <div className="h-6 w-6 text-gray-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{animatedCampaigns}</div>
            <p className="text-xs text-gray-500">
              Running reminder campaigns
            </p>
          </CardContent>
        </Card>

        {/* Messages Sent Card */}
        <Card className="border rounded-lg shadow-sm hover:shadow transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <div className="h-6 w-6 text-gray-400">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{animatedMessages}</div>
            <p className="text-xs text-gray-500">
              WhatsApp reminders sent
            </p>
          </CardContent>
        </Card>

        {/* Customers Due Card */}
        <Card className="border rounded-lg shadow-sm hover:shadow transition-all bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Due</CardTitle>
            <div className="h-6 w-6 text-gray-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{animatedDue}</div>
            <p className="text-xs text-gray-500">
              Clients due for follow-up
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="border rounded-lg shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you can perform
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div 
              className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => router.push('/dashboard/customers/new')}
            >
              <div className="flex items-center mb-2">
                <div className="mr-2 text-gray-500">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <h3 className="font-medium">Add New Customer</h3>
              </div>
              <p className="text-sm text-gray-500">Record a new client&apos;s information</p>
            </div>
            
            <div 
              className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => router.push('/dashboard/campaigns/new')}
            >
              <div className="flex items-center mb-2">
                <div className="mr-2 text-gray-500">
                  <BarChart className="h-5 w-5" />
                </div>
                <h3 className="font-medium">Create Campaign</h3>
              </div>
              <p className="text-sm text-gray-500">Set up an automated reminder flow</p>
            </div>
            
            <div 
              className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => router.push('/dashboard/settings')}
            >
              <div className="flex items-center mb-2">
                <div className="mr-2 text-gray-500">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-medium">Configure WhatsApp</h3>
              </div>
              <p className="text-sm text-gray-500">Connect your WhatsApp Business API</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 