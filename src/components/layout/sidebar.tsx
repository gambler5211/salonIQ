import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
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

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen w-64 bg-white border-r border-gray-100 hidden md:flex flex-col shadow-sm">
      <div className="p-6">
        <Link href="/dashboard" className="inline-block hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold">Salon<span className="text-[#ff7b54]">IQ</span></h1>
        </Link>
      </div>
      
      <nav className="mt-6 flex-1 px-3">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (pathname?.startsWith(`${item.href}/`) && item.href !== '/dashboard');
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
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
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
} 