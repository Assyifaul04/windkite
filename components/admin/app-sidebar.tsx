"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { NavMain } from "@/components/admin/nav-main";
import { NavProjects } from "@/components/admin/nav-projects";
import { NavSecondary } from "@/components/admin/nav-secondary";
import { NavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  TerminalIcon,
  BookOpenIcon,
  GearIcon,
  LifebuoyIcon,
  PaperPlaneTiltIcon,
  MapPinIcon,
  ImageIcon,
  UsersIcon,
  CloudIcon,
  CompassIcon,
  WindIcon,
  DatabaseIcon,
  PaintBrushIcon,
  LayoutIcon,
  ImagesIcon,
  MegaphoneIcon, // Tambahkan icon untuk Ad Settings
} from "@phosphor-icons/react";

// Data untuk sidebar yang disesuaikan dengan struktur database
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <TerminalIcon />,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/admin/dashboard",
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
        },
      ],
    },
    {
      title: "Weather & Locations",
      url: "#",
      icon: <CloudIcon />,
      items: [
        {
          title: "Saved Locations",
          url: "/admin/locations",
          description: "Manage saved locations",
        },
        {
          title: "Weather Logs",
          url: "/admin/weather-logs",
          description: "View weather data history",
        },
        {
          title: "Weather Analytics",
          url: "/admin/weather-analytics",
          description: "Wind speed & direction charts",
        },
        {
          title: "Wind Rose",
          url: "/admin/wind-rose",
          description: "Wind direction visualization",
        },
      ],
    },
    {
      title: "Kite Designs",
      url: "#",
      icon: <ImageIcon />,
      items: [
        {
          title: "All Designs",
          url: "/admin/designs",
          description: "Manage all kite designs with cover images",
        },
        {
          title: "Kite Frames",
          url: "/admin/designs/frames",
          description: "Kite frame templates with marker & clip-path",
        },
        {
          title: "Frame Editor",
          url: "/admin/designs/frames/editor",
          description: "Create/Edit frame markers & clipping path",
        },
        {
          title: "Design Gallery",
          url: "/admin/designs/gallery",
          description: "Public gallery of kite designs",
        },
        {
          title: "Design Status",
          url: "/admin/designs/status",
          description: "Filter by PENDING, PROCESSING, COMPLETED, FAILED",
        },
        {
          title: "Storage Files",
          url: "/admin/designs/storage",
          description: "Manage uploaded images & Google Drive files",
        },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: <UsersIcon />,
      items: [
        {
          title: "All Users",
          url: "/admin/users",
          description: "Manage user accounts",
        },
        {
          title: "Admins",
          url: "/admin/users/admins",
          description: "Administrator accounts",
        },
        {
          title: "User Activity",
          url: "/admin/users/activity",
          description: "User activity logs",
        },
      ],
    },
    {
      title: "System",
      url: "#",
      icon: <DatabaseIcon />,
      items: [
        {
          title: "Database Status",
          url: "/admin/system/database",
          description: "Database health & metrics",
        },
        {
          title: "Cron Jobs",
          url: "/admin/system/cron",
          description: "Scheduled tasks & weather updates",
        },
        {
          title: "Logs",
          url: "/admin/system/logs",
          description: "System activity logs",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <GearIcon />,
      items: [
        {
          title: "General",
          url: "/admin/settings/general",
        },
        {
          title: "Weather API",
          url: "/admin/settings/weather-api",
          description: "Weather API configuration",
        },
        {
          title: "Storage",
          url: "/admin/settings/storage",
          description:
            "Manage storage & backups (Neon Database & Google Drive)",
        },
        // ==========================================
        // TAMBAHAN: Menu Ad Settings
        // ==========================================
        {
          title: "Ad Settings",
          url: "/admin/settings/ads",
          description: "Google AdSense configuration",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Documentation",
      url: "/admin/docs",
      icon: <BookOpenIcon />,
    },
    {
      title: "Support",
      url: "/admin/support",
      icon: <LifebuoyIcon />,
    },
    {
      title: "Feedback",
      url: "/admin/feedback",
      icon: <PaperPlaneTiltIcon />,
    },
  ],
  projects: [
    {
      name: "Location Manager",
      url: "/admin/locations",
      icon: <MapPinIcon />,
    },
    {
      name: "Weather Data",
      url: "/admin/weather-logs",
      icon: <CompassIcon />,
    },
    {
      name: "Kite Gallery",
      url: "/admin/designs/gallery",
      icon: <ImagesIcon />,
    },
    {
      name: "Wind Analytics",
      url: "/admin/wind-rose",
      icon: <WindIcon />,
    },
    {
      name: "Frame Templates",
      url: "/admin/designs/frames",
      icon: <LayoutIcon />,
    },
  ],
  user: {
    name: "Admin WindKite",
    email: "admin@windkite.com",
    avatar: "/avatars/admin.jpg",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/admin/dashboard" className="block w-full">
              <SidebarMenuButton size="lg" className="w-full">
                <div className="flex items-center justify-center w-full overflow-hidden">
                  {/* Logo untuk Light Mode */}
                  <Image
                    src="/image/logo-hitam.png"
                    alt="WindKite Logo Light"
                    width={130}
                    height={35}
                    priority
                    className="h-7 w-auto object-contain dark:hidden block"
                  />
                  {/* Logo untuk Dark Mode */}
                  <Image
                    src="/image/logo-putih.png"
                    alt="WindKite Logo Dark"
                    width={130}
                    height={35}
                    priority
                    className="h-7 w-auto object-contain hidden dark:block"
                  />
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}