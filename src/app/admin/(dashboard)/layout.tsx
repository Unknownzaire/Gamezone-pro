
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import Logo from '@/components/Logo';
import { LayoutDashboard, LogOut, Settings, Swords, Users, BarChart3, DollarSign, ChevronDown, Banknote, Gift, Megaphone, UserPlus, LifeBuoy, Bot, Ticket, Tags } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Swords },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/referrals', label: 'Referrals', icon: UserPlus },
  { href: '/admin/redeem-codes', label: 'Redeem Codes', icon: Tags },
  { href: '/admin/transactions', label: 'Transactions', icon: Banknote },
  { href: '/admin/promotions', label: 'Promotions', icon: Gift },
  { href: '/admin/promotional-ads', label: 'Promotional Ads', icon: Megaphone },
  { href: '/admin/royal-pass', label: 'Royal Pass', icon: Ticket },
  { href: '/admin/help-agent', label: 'Help Agent', icon: Bot },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo className="group-data-[collapsible=icon]:w-fit" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
             <Collapsible asChild>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        className="w-full justify-between"
                        isActive={pathname.startsWith('/admin/reports') || pathname.startsWith('/admin/revenue-report')}
                        tooltip={{children: 'Reports'}}
                    >
                        <div className="flex items-center gap-2">
                        <BarChart3 />
                        <span>Reports</span>
                        </div>
                        <ChevronDown />
                    </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                        <Link href="/admin/reports" legacyBehavior passHref>
                            <SidebarMenuSubButton isActive={pathname === '/admin/reports'}>
                            <BarChart3 />
                            Prize Report
                            </SidebarMenuSubButton>
                        </Link>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                        <Link href="/admin/revenue-report" legacyBehavior passHref>
                            <SidebarMenuSubButton isActive={pathname === '/admin/revenue-report'}>
                            <DollarSign />
                            Revenue Report
                            </SidebarMenuSubButton>
                        </Link>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
             <SidebarMenuItem>
                <Link href="/admin/settings" legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/admin/settings')}
                    tooltip={{ children: 'Settings' }}
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center gap-4">
           <div className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">Admin User</p>
                <p className="truncate text-xs text-muted-foreground">admin@gamezonepro.com</p>
            </div>
           </div>
           <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full justify-start gap-2 p-2">
             <LogOut />
             <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
           </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                <h1 className="font-headline text-lg font-semibold md:text-2xl">Admin Panel</h1>
            </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
