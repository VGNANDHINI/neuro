'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  Mic,
  Hand,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from './ui/separator';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
  group: 'main' | 'tests';
}

const navItems: NavItem[] = [
  { id: 'dashboard', href: '/dashboard', icon: Home, label: 'Dashboard', group: 'main' },
  { id: 'results', href: '/results', icon: FileText, label: 'Results', group: 'main' },
  { id: 'progress', href: '/progress', icon: BarChart3, label: 'Progress', group: 'main' },
  { id: 'spiral-test', href: '/tests/spiral', icon: Activity, label: 'Spiral Test', group: 'tests' },
  { id: 'voice-test', href: '/tests/voice', icon: Mic, label: 'Voice Test', group: 'tests' },
];

export function AppSidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const pathname = usePathname();
  const { appUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged out successfully.' });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Logout failed.' });
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Logo />
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(false)}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Main Menu</p>
        {navItems.filter(item => item.group === 'main').map((item) => (
          <TooltipProvider key={item.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground">Tests</p>
        {navItems.filter(item => item.group === 'tests').map((item) => (
          <TooltipProvider key={item.id} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href} onClick={() => setIsOpen(false)}>
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Separator className="my-2" />
        <div className="flex items-center space-x-3 mb-3 p-2">
          <Avatar>
            <AvatarImage src={appUser?.photoURL} />
            <AvatarFallback>{appUser?.name?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{appUser?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{appUser?.email}</div>
          </div>
        </div>

        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/profile" onClick={() => setIsOpen(false)}>
            <Settings className="mr-2 h-5 w-5" /> Profile
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={handleLogout}>
          <LogOut className="mr-2 h-5 w-5" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden',
          isOpen ? 'block' : 'hidden'
        )}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex-col',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
