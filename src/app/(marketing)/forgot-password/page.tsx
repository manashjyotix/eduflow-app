"use client"

import { useState } from "react"
import Link from "next/link"
import { Zap, ArrowRight, ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Step = "email" | "sent" | "reset" | "done"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setStep("sent")
    }, 1400)
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (code.trim().length < 4) {
      setError("Please enter the 6-digit code from your email.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep("reset")
    }, 1000)
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep("done")
    }, 1200)
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduFlow</span>
          </Link>
        </div>

        {/* ── Step 1: Enter email ──────────────────────────────────── */}
        {step === "email" && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your school email and we&apos;ll send a reset code.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSendLink} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@yourschool.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending code…
                    </span>
                  ) : (
                    <>Send Reset Code <ArrowRight className="size-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-5">
                <Link href="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="size-3" /> Back to sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Code sent confirmation ─────────────────────── */}
        {step === "sent" && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="size-16 rounded-full bg-[var(--ef-brand-light)] dark:bg-[var(--ef-brand-muted)] flex items-center justify-center mx-auto mb-5">
                <Mail className="size-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-xl tracking-[0.5em] font-mono"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    <>Verify Code <ArrowRight className="size-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-4">
                Didn&apos;t receive it?{" "}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => { setStep("email"); setCode("") }}
                  className="h-auto p-0 text-xs"
                >
                  Resend code
                </Button>
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: New password ────────────────────────────────── */}
        {step === "reset" && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length > i * 3
                              ? password.length < 6
                                ? "bg-destructive"
                                : password.length < 10
                                ? "bg-[var(--ef-amber)]"
                                : "bg-[var(--ef-green)]"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <>Reset Password <ArrowRight className="size-4" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 4: Done ────────────────────────────────────────── */}
        {step === "done" && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="size-16 rounded-full bg-[var(--ef-green-light)] dark:bg-[var(--ef-green-light)] flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="size-8 text-[var(--ef-green-dark)]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password reset!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Button className="w-full" size="lg" asChild>
                <Link href="/login">Sign In <ArrowRight className="size-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
