import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    name: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Megaphone,
  },
  {
    name: 'Templates',
    href: '/dashboard/templates',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-[#1e2c3a]">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[300px] p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full bg-white">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold">Salon<span className="text-[#ff7b54]">IQ</span></h1>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-[#1e2c3a]">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          
          <nav className="flex-1 overflow-auto">
            <ul className="p-3 space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (pathname?.startsWith(`${item.href}/`) && item.href !== '/dashboard');
                
                return (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-[#ff7b54]/10 text-[#ff7b54] font-semibold" 
                          : "hover:bg-gray-50 text-[#1e2c3a]/70 hover:text-[#1e2c3a]"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4", 
                        isActive ? "text-[#ff7b54]" : "text-[#1e2c3a]/60"
                      )} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-4 m-3 mb-6 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="w-full justify-start text-[#1e2c3a]/70 hover:text-[#1e2c3a] hover:bg-gray-50 border-gray-200"
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 