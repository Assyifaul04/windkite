'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut, ChevronDown, User, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  dashboardUrl: string;
}

export function UserDropdown({ user, dashboardUrl }: UserDropdownProps) {
  // Fungsi handle logout
  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 group">
        <div className="flex items-center gap-1">
          <Avatar className="h-8 w-8 border border-sky-200 transition-all group-hover:border-sky-400">
            <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-sky-100 text-sky-700 font-semibold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {/* Group untuk Label User */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Group untuk Menu Items */}
        <DropdownMenuGroup>
          {/* Dashboard Link */}
          <DropdownMenuItem className="cursor-pointer p-0">
            <Link href={dashboardUrl} className="flex items-center w-full px-2 py-1.5">
              <LayoutDashboard className="mr-2 h-4 w-4 text-sky-500" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          {/* Profile Link */}
          <DropdownMenuItem className="cursor-pointer p-0">
            <Link href="/profile" className="flex items-center w-full px-2 py-1.5">
              <User className="mr-2 h-4 w-4 text-sky-500" />
              <span>Profil</span>
            </Link>
          </DropdownMenuItem>
          
          {/* Admin Panel - Hanya untuk ADMIN */}
          {user?.role === 'ADMIN' && (
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link href="/admin/dashboard" className="flex items-center w-full px-2 py-1.5">
                <Shield className="mr-2 h-4 w-4 text-purple-500" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Group untuk Logout - Destructive */}
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}