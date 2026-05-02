import Link from "next/link";
import { Eye, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-sahara-bg text-sahara-fg">
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <section className="relative hidden overflow-hidden bg-sahara-surface-low md:flex md:w-1/2">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-80 mix-blend-multiply"
              alt="A serene and professional digital art piece showcasing a high-quality AI medical assistant interface floating softly over a warm, sun-baked linen background."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMREo5qDfL3Py_BqaeC79b5J96p_Z7hK4wen9dJBNq8H1pd6_08D5HEmK9ZAtlC71CseUQSqvhnBy-9RAknqZaYRxLpeYKp_uDgAHE9qvwa0bpd-GpaZ0ifz58pzdDIUTS0BrC0dzg9MrrdImlquYxXpjZNK7IZON7ToH5ff6D213bqVqYFC7qBHeewdBEvZ6vnRSBzw033XHCp-7dPDPoXFB1YBHAfhUAKoO56XXIFNmxnYCOZ1lXmobWEtQMVEGehvo2s1AgYy4"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-sahara-bg/90 via-sahara-bg/40 to-transparent" />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-16">
            <div>
              <h1 className="text-3xl font-serif font-bold text-sahara-primary tracking-tight">MedBridge</h1>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-sahara-primary/30 to-transparent" />
            </div>

            <div className="max-w-md">
              <h2 className="mb-6 font-serif text-6xl leading-tight text-sahara-fg">Your AI Health Companion</h2>
              <p className="text-xl font-body font-light tracking-wide text-sahara-muted">
                Smart, Safe, Always Available. Bridging the gap between clinical excellence and compassionate care.
              </p>
            </div>

            <div className="flex items-center gap-4 text-sahara-primary">
              <ShieldCheck className="size-8" />
              <span className="text-sm font-semibold tracking-widest uppercase">Trusted by 10k+ Professionals</span>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-sahara-bg p-6 md:w-1/2 md:p-12 lg:p-24">
          <div className="w-full max-w-md">
            <div className="mb-12 text-center md:hidden">
              <h1 className="text-3xl font-serif font-bold text-sahara-primary">MedBridge</h1>
            </div>

            <div className="rounded-3xl border border-sahara-border/40 bg-white p-8 shadow-ambient md:p-10">
              <div className="mb-10 text-center">
                <h3 className="mb-2 font-serif text-3xl text-sahara-fg">Welcome Back</h3>
                <p className="text-sm text-sahara-muted">Please enter your details to sign in.</p>
              </div>

              <div className="mb-8 flex rounded-xl bg-sahara-surface-low p-1">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-sahara-primary shadow-sm transition-all duration-300"
                >
                  Patient
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 text-sm font-medium text-sahara-muted hover:text-sahara-fg transition-all duration-300"
                >
                  Doctor
                </button>
              </div>

              <form className="space-y-6">
                <div>
                  <label
                    className="mb-2 block text-xs font-bold uppercase tracking-widest text-sahara-muted"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <input
                    className="w-full rounded-xl border border-sahara-border/60 bg-sahara-bg px-4 py-3 text-sahara-fg outline-none transition-all placeholder:text-sahara-muted/60 focus:border-sahara-primary focus:ring-1 focus:ring-sahara-primary"
                    id="email"
                    placeholder="name@medbridge.ai"
                    type="email"
                  />
                </div>

                <div>
                  <div className="mb-2 flex justify-between">
                    <label
                      className="block text-xs font-bold uppercase tracking-widest text-sahara-muted"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <a
                      className="text-xs font-semibold text-sahara-primary hover:underline decoration-sahara-primary underline-offset-4 transition-all"
                      href="#"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-sahara-border/60 bg-sahara-bg px-4 py-3 text-sahara-fg outline-none transition-all placeholder:text-sahara-muted/60 focus:border-sahara-primary focus:ring-1 focus:ring-sahara-primary"
                      id="password"
                      placeholder="••••••••"
                      type="password"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sahara-muted/60"
                      type="button"
                      aria-label="Show password"
                    >
                      <Eye className="size-5" />
                    </button>
                  </div>
                </div>

                <button
                  className="w-full rounded-xl bg-sahara-primary py-4 font-bold tracking-wide text-white shadow-lg shadow-sahara-primary/10 transition-all hover:opacity-90 active:scale-[0.98]"
                  type="submit"
                >
                  Continue
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sahara-border/60" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 font-medium uppercase tracking-widest text-sahara-muted">
                    Or continue with
                  </span>
                </div>
              </div>

              <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-sahara-border bg-white px-4 py-3.5 transition-all duration-300 hover:bg-sahara-surface-low">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-semibold text-sahara-fg">Continue with Google</span>
              </button>

              <div className="mt-10 text-center">
                <p className="text-sm text-sahara-muted">
                  New to MedBridge AI?
                  <a
                    className="ml-1 font-bold text-sahara-primary hover:underline decoration-sahara-primary underline-offset-4 transition-all"
                    href="#"
                  >
                    Create Account
                  </a>
                </p>
              </div>
            </div>

            <footer className="mt-8 flex justify-center gap-6">
              <a
                className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 transition-colors hover:text-sahara-primary"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 transition-colors hover:text-sahara-primary"
                href="#"
              >
                Terms of Service
              </a>
              <a
                className="text-[10px] font-bold uppercase tracking-widest text-sahara-muted/60 transition-colors hover:text-sahara-primary"
                href="#"
              >
                Help Center
              </a>
            </footer>

            <div className="mt-10 text-center">
              <Link className="text-xs text-sahara-muted hover:text-sahara-primary" href="/">
                Back to Welcome
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

