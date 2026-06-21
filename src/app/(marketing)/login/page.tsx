"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Zap, Eye, EyeOff, Chrome, ArrowRight, Shield,
  Users, LayoutDashboard, GraduationCap, Baby
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/context/auth-context"
import { ROLE_LABELS } from "@/context/role-context"
import { loginSchema, type LoginInput } from "@/lib/schemas/auth"
import { cn } from "@/lib/utils"

const DEMO_ROLES = [
  {
    label: "Admin",
    icon: Shield,
    email: "admin@hcea.edu",
    password: "admin123",
    roleAccent: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    desc: "Full school management",
  },
  {
    label: "Teacher",
    icon: GraduationCap,
    email: "priya@hcea.edu",
    password: "teacher123",
    roleAccent: "text-success-foreground",
    bg: "bg-success/40",
    border: "border-success-foreground/20",
    desc: "Schedule & proxy",
  },
  {
    label: "Parent",
    icon: Baby,
    email: "parent@hcea.edu",
    password: "parent123",
    roleAccent: "text-warning-foreground",
    bg: "bg-warning/40",
    border: "border-warning-foreground/20",
    desc: "Child portal",
  },
  {
    label: "Management",
    icon: LayoutDashboard,
    email: "mgmt@hcea.edu",
    password: "mgmt123",
    roleAccent: "text-[var(--ef-purple)]",
    bg: "bg-[var(--ef-purple-light)]",
    border: "border-[var(--ef-purple-light)]",
    desc: "Morning briefing",
  },
] as const

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  // remember-me is cosmetic in demo mode but we log intent
  void remember

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function submitLogin(emailValue: string, passwordValue: string) {
    setLoading(true)
    setAuthError("")
    // Simulate async login, then validate against demo credentials
    setTimeout(() => {
      const result = login(emailValue, passwordValue)
      setLoading(false)
      if (!result.ok) {
        setAuthError(result.error)
        return
      }
      toast.success(`Welcome back, ${ROLE_LABELS[result.role]}!`, {
        description: "You're now signed in to EduFlow.",
      })
      // Respect callbackUrl if present (set by middleware on protected routes)
      const callbackUrl = searchParams.get("callbackUrl")
      router.push(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : result.redirectTo)
    }, 600)
  }

  const onSubmit = (data: LoginInput) => {
    submitLogin(data.email, data.password)
  }

  const quickLogin = (role: (typeof DEMO_ROLES)[number]) => {
    setAuthError("")
    form.setValue("email", role.email)
    form.setValue("password", role.password)
    submitLogin(role.email, role.password)
  }

  const handleGoogle = () => {
    toast.info("Google sign-in is not wired in this demo.", {
      description: "Use a quick demo role below to explore EduFlow.",
    })
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4 py-12 fade-in">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your school&apos;s dashboard</p>
        </div>

        <Card className="shadow-lg border">
          <CardContent className="p-6">
            {/* Auth-level error (wrong credentials, etc.) */}
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {authError}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@yourschool.edu"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pr-10"
                            {...field}
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-3 -translate-y-1/2 h-auto w-auto hover:bg-transparent"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember" className="text-sm font-normal cursor-pointer text-foreground">
                    Remember me for 30 days
                  </label>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    <>Sign In <ArrowRight className="size-4" /></>
                  )}
                </Button>
              </form>
            </Form>

            <div className="my-5 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <Separator className="flex-1" />
            </div>

            {/* Google */}
            <Button variant="outline" className="w-full gap-2" type="button" onClick={handleGoogle}>
              <Chrome className="size-4" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Start 14-day free trial
          </Link>
        </p>

        {/* Demo role shortcuts */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="size-3" /> Quick demo login
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ROLES.map((role) => (
              <button
                key={role.label}
                type="button"
                onClick={() => quickLogin(role)}
                disabled={loading}
                className={cn(
                  "p-3 rounded-xl border hover:shadow-sm transition-all text-left group disabled:opacity-50",
                  role.border, role.bg
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <role.icon className={cn("size-3.5", role.roleAccent)} />
                  <span className={cn("text-xs font-semibold", role.roleAccent)}>{role.label}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 hidden group-hover:flex">Login</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{role.desc}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{role.email}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Click a role to sign in instantly · For demo use only
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
