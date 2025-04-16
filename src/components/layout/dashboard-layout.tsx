import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './sidebar';
import MobileNav from './mobile-nav';
import ProfileDropdown from './profile-dropdown';
import { useAuth } from '@/lib/auth-context';
import { getSalon } from '@/lib/db-service';
import { Salon } from '@/lib/types';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { salonId } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalonData = async () => {
      if (salonId) {
        try {
          const salonData = await getSalon(salonId);
          setSalon(salonData);
        } catch (error) {
          console.error('Error fetching salon data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSalonData();
  }, [salonId]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-full">
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center">
            <MobileNav />
            <h1 className="ml-4 font-medium text-[#1e2c3a]">
              {loading ? (
                "Dashboard"
              ) : (
                salon?.salonName ? (
                  <>
                    {salon.salonName}&#39;s Dashboard
                  </>
                ) : "Dashboard"
              )}
            </h1>
          </div>
          
          <div className="flex items-center">
            <ProfileDropdown />
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 