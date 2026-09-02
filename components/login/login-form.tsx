'use client'

import { signIn } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { theme } = useTheme()
  
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Header Form */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Masuk ke Akun Anda
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Masukkan email Anda di bawah untuk masuk ke WindKite
        </p>
      </div>

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="email" className="text-foreground">Email</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            className="border-input bg-background focus-visible:ring-primary" 
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="text-foreground">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              Lupa password?
            </a>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            className="border-input bg-background focus-visible:ring-primary" 
          />
        </Field>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2">
          Masuk
        </Button>

        <FieldSeparator className="text-muted-foreground my-2">Atau lanjutkan dengan</FieldSeparator>

        {/* Tombol Google OAuth */}
        <Button 
          variant="outline" 
          type="button" 
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full border-input hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c-.07-.8-.63-1.54-1.45-1.54H12v4.51h6.61c-.29 1.55-1.14 2.87-2.4 3.75v3.1h3.88c2.27-2.09 3.65-5.17 3.65-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.1c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.19v3.19C3.16 21.36 7.24 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.2c-.25-.72-.39-1.49-.39-2.2 0-.71.14-1.48.39-2.2V6.61H1.19C.43 8.14 0 9.99 0 12s.43 3.86 1.19 5.39l4.09-3.19z" />
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.6 1.81l3.45-3.45C17.95 1.15 15.24 0 12 0 7.24 0 3.16 2.64 1.19 6.61l4.09 3.19c.95-2.84 3.6-4.95 6.72-4.95z" />
          </svg>
          Masuk dengan Google
        </Button>
      </FieldGroup>
    </form>
  )
}