// components/user/dashboard/settings-dialog.tsx

"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  House,
  User,
  MapPin,
  Cloud,
  Image,
  ChartBar,
  Bell,
  Gear,
  Shield,
  SignOut,
  List,
  X
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOut } from "next-auth/react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Menu items (tanpa deskripsi)
const menuItems = [
  { id: "dashboard", name: "Dashboard", icon: <House />, path: "/user/dashboard" },
  { id: "locations", name: "Lokasi Saya", icon: <MapPin />, path: "/user/locations" },
  { id: "weather", name: "Data Cuaca", icon: <Cloud />, path: "/user/weather" },
  { id: "designs", name: "Desain AI", icon: <Image />, path: "/user/designs" },
  { id: "analytics", name: "Analitik", icon: <ChartBar />, path: "/user/analytics" },
  { id: "profile", name: "Profil Saya", icon: <User />, path: "/user/profile" },
  { id: "notifications", name: "Notifikasi", icon: <Bell />, path: "/user/notifications" },
  { id: "settings", name: "Pengaturan", icon: <Gear />, path: "/user/settings" },
]

interface SettingsDialogProps {
  children?: React.ReactNode
  trigger?: React.ReactNode
}

export function SettingsDialog({ children, trigger }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [activeMenu, setActiveMenu] = React.useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = session?.user?.role === "ADMIN"

  const handleMenuClick = (menuId: string, path: string) => {
    setActiveMenu(menuId)
    router.push(path)
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Ambil path aktif dari URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      const currentMenu = menuItems.find(item => path.includes(item.path))
      if (currentMenu) {
        setActiveMenu(currentMenu.id)
      }
    }
  }, [])

  // Dapatkan nama menu aktif
  const activeMenuName = menuItems.find(m => m.id === activeMenu)?.name || "Dashboard"

  // Sidebar Menu Component
  const SidebarMenuContent = () => (
    <>
      {/* User Profile Section */}
      <div className="px-3 py-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-sky-200">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
            <AvatarFallback className="bg-sky-100 text-sky-700">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email || ""}</p>
            {isAdmin && (
              <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={activeMenu === item.id}
                  onClick={() => handleMenuClick(item.id, item.path)}
                  className="cursor-pointer"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Admin Menu - Hanya untuk ADMIN */}
            {isAdmin && (
              <>
                <div className="px-3 py-2 mt-2 border-t">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Admin</span>
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push("/admin/dashboard")}
                    className="cursor-pointer"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Logout */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <SignOut className="h-4 w-4" />
                <span>Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button variant="default" size="lg" className="gap-3 text-lg px-8 py-6">
            <Gear className="h-6 w-6" />
            Buka Dashboard
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[90vh] md:max-w-[95vw] lg:max-h-[600px] lg:max-w-[1000px] w-full h-full md:h-auto">
        <DialogTitle className="sr-only">Dashboard Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Navigasi menu dashboard Anda
        </DialogDescription>
        <SidebarProvider className="items-start h-full">
          {/* Sidebar Desktop */}
          <Sidebar collapsible="none" className="hidden md:flex w-[220px] lg:w-[240px] h-full">
            <SidebarContent>
              <SidebarMenuContent />
            </SidebarContent>
          </Sidebar>

          {/* Konten Utama */}
          <main className="flex flex-1 flex-col h-full overflow-hidden w-full">
            {/* Header */}
            <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 px-3 md:px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {/* Mobile Menu Button - Fixed: Removed asChild */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger>
                  <Button variant="ghost" size="sm" className="md:hidden -ml-2 h-8 w-8 p-0">
                    <List className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-semibold">Menu</span>
                    <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="overflow-y-auto h-full pb-20">
                    <SidebarMenuContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Breadcrumb */}
              <div className="flex-1 min-w-0">
                <Breadcrumb>
                  <BreadcrumbList className="flex-nowrap overflow-hidden">
                    <BreadcrumbItem className="hidden sm:block">
                      <BreadcrumbLink href="#" className="text-sm">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden sm:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-semibold text-sm sm:text-base truncate">
                        {activeMenuName}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Mobile User Avatar */}
              <div className="md:hidden">
                <Avatar className="h-8 w-8 border border-sky-200">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-sky-100 text-sky-700 text-xs">
                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>

            {/* Content Area - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="max-w-full">
                {children}
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}