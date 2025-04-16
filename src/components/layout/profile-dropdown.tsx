'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  LogOut,
  HelpCircle,
  CreditCard,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getSalon } from '@/lib/db-service';
import { Salon } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProfileDropdown() {
  const { logout, salonId } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Extract initials from salon name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading || !salon) {
    return (
      <div className="flex items-center h-10 gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <div className="h-8 w-8 rounded-full bg-[#ff7b54] text-white flex items-center justify-center font-semibold text-sm">
            {getInitials(salon.salonName)}
          </div>
          <span className="text-sm font-medium text-[#1e2c3a] max-w-[120px] truncate">
            {salon.salonName}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Salon Management</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleNavigation('/dashboard/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigation('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigation('/dashboard/settings/whatsapp')}>
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Configure WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigation('/dashboard/billing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing & Plans</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigation('/dashboard/help')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help Center</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 