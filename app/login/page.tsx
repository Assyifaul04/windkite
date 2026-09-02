import { LoginForm } from "@/components/login/login-form"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/layout/thame-toggle"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background text-foreground font-mono">
      {/* Sisi Kiri: Form Login */}
      <div className="flex flex-col gap-4 p-6 md:p-10 justify-between">
        {/* Header Logo Kecil & Theme Toggle */}
        <div className="flex justify-between items-center gap-2 md:justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium">
            {/* Logo untuk Light Mode (Sembunyi saat Dark Mode) */}
            <Image 
              src="/image/logo-hitam.png" 
              alt="WindKite Logo Light" 
              width={120} 
              height={30} 
              priority
              className="h-7 w-auto object-contain dark:hidden block"
            />
            {/* Logo untuk Dark Mode (Sembunyi saat Light Mode) */}
            <Image 
              src="/image/logo-putih.png" 
              alt="WindKite Logo Dark" 
              width={120} 
              height={30} 
              priority
              className="h-7 w-auto object-contain hidden dark:block"
            />
          </Link>
          <ThemeToggle />
        </div>

        {/* Kotak Form */}
        <div className="flex flex-1 items-center justify-center my-auto">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>

        {/* Footer Kecil */}
        <div className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} WindKite. All rights reserved.
        </div>
      </div>

      {/* Sisi Kanan: Gambar Branding / Ilustrasi Angin Layangan */}
      <div className="relative hidden bg-primary/10 lg:flex items-center justify-center overflow-hidden border-l border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/30 z-10" />
        {/* Logo untuk Light Mode */}
        <Image
          src="/image/logo-hitam.png"
          alt="WindKite Visual Light"
          width={500}
          height={300}
          className="relative z-20 object-contain drop-shadow-xl max-w-md w-full p-8 dark:hidden block"
          priority
        />
        {/* Logo untuk Dark Mode */}
        <Image
          src="/image/logo-putih.png"
          alt="WindKite Visual Dark"
          width={500}
          height={300}
          className="relative z-20 object-contain drop-shadow-xl max-w-md w-full p-8 hidden dark:block"
          priority
        />
      </div>
    </div>
  )
}