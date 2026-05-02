import Link from "next/link";
import { AlertTriangle, ArrowRight, Bell, Bolt, Brain, MapPin, Stethoscope } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-sahara-bg text-sahara-fg">
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-sahara-border/60 bg-sahara-bg px-8 py-4 shadow-ambient">
        <div className="text-2xl font-serif font-bold text-sahara-primary">MedBridge</div>
        <div className="hidden items-center space-x-8 md:flex">
          <a className="cursor-pointer text-sm text-sahara-muted transition-colors hover:text-sahara-primary active:scale-95" href="#solutions">
            Solutions
          </a>
          <a className="cursor-pointer text-sm text-sahara-muted transition-colors hover:text-sahara-primary active:scale-95" href="#providers">
            For Providers
          </a>
          <a className="cursor-pointer text-sm text-sahara-muted transition-colors hover:text-sahara-primary active:scale-95" href="#technology">
            Technology
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="size-5 text-sahara-muted" />
          <div className="size-8 overflow-hidden rounded-full border border-sahara-border">
            <img
              alt="User profile"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRsXB3JQPJWGZ2qi3iGUAJ92ulWoviq11N92aAiMc7fAwobj0JQ59XhgohzzfKvUlqEQ-wjWbxHJB4_U2PZhAjwqbofS8ni9jsTRnkO4Q6ipCl0W18QUlKgo2necyYis_XVpGqTZKlwosHxXhjI7utm9ko-cdv-MxSfg5iIjWp233stmqkKPtXgZ07qFiwDIaaSfURlUTuTRKflkSgRbG7s03oG5O__uj_B9v8PcKppwSTnCrxDeRjDy7ljmY5n-QrNiKoGSGprHQ"
            />
          </div>
        </div>
      </nav>

      <main className="pb-12 pt-24">
        <section className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-8 py-16 lg:flex-row lg:py-32">
          <div className="flex-1 space-y-8">
            <div className="inline-block rounded-full bg-[#fce0e0] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#6e3030]">
              Revolutionizing Care
            </div>
            <h1 className="font-serif text-6xl font-bold leading-[1.1] text-sahara-fg lg:text-8xl">
              Healthcare that <br />
              <span className="italic text-sahara-primary">breathes</span> with you.
            </h1>
            <p className="max-w-xl text-xl leading-relaxed text-sahara-muted">
              MedBridge combines human expertise with sun-baked AI simplicity to bring you a healthcare experience that
              is as warm as it is intelligent. Welcome to the future of patient-centered care.
            </p>
            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                href="/login?from=welcome"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-sahara-primary px-8 py-4 font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Continue to Login
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/doctor"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-sahara-border px-8 py-4 font-bold text-sahara-fg transition-all hover:bg-sahara-surface-low active:scale-[0.98]"
              >
                Join as Healthcare Provider
              </Link>
            </div>
          </div>

          <div className="relative w-full flex-1 lg:w-auto">
            <div className="relative z-10 mx-auto aspect-[4/5] max-w-md rotate-2 overflow-hidden rounded-2xl shadow-2xl">
              <img
                alt="Healthcare Professional"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPsazx8vD8mcn7k0nfTV6qnQseHfd048_s8QLG2PtDqAi1cHib6gg1V5XPdc90qFw7I-4c1SVDVWjwjHnVbMgHMOy6Pi36o6SO0v2q6HwMtHlCOmOYkdEFR254oyAQE1TZRtR1fxVv3cDnE3ZU4yNzyBMX7MYdO4x_-zytOnYvTjG_DtWPKIs23-8mfjlsyrr-AUk7PRoeqhdScxKxgJaCApbDk1b7vWdLlNh_jw1eErG-d1cfbwhpec1h0NX9bkQhGlCtrcoYB78"
              />
            </div>
            <div className="absolute -left-8 top-1/2 -z-0 size-64 -translate-y-1/2 rounded-full bg-[#f0a878]/30 blur-3xl" />
            <div className="absolute -bottom-0 -right-4 -z-0 size-48 rounded-full bg-[#fce0e0]/30 blur-2xl" />
          </div>
        </section>

        <section id="solutions" className="bg-sahara-surface-low py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 space-y-4 text-center">
              <h2 className="font-serif text-4xl font-bold lg:text-5xl">The MedBridge Advantage</h2>
              <p className="mx-auto max-w-2xl text-sahara-muted">
                Focused on clarity, efficiency, and a touch of human warmth.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div id="technology" className="rounded-xl border border-sahara-border/60 bg-white p-10 shadow-ambient md:col-span-2">
                <div className="grid items-center gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Brain className="size-9 text-sahara-primary" />
                    <h3 className="font-serif text-3xl font-bold">AI-Driven Care Scanners</h3>
                    <p className="leading-relaxed text-sahara-muted">
                      Our advanced AI does not just process data, it understands context. Get insights that are accurate
                      and easy to understand.
                    </p>
                  </div>
                  <div className="h-48 overflow-hidden rounded-lg bg-[#ece6dc]">
                    <img
                      className="h-full w-full object-cover opacity-80"
                      alt="AI Dashboard"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSMpB6Dv217Lyd2HjjiKeGU2EiVqEZ_5ghf4v-4zOcOvKA9Nk6oJjKw8jtuBYjIaj4ewkSNop3AHdVO1G3SUIUpBrrQnPNJgcGVHrrMs-perp7zcbNXnfHuZRUe_QWNjmoZepTJ-i-ygDGjWq-1qpfws2lC5f1u8hHWcrHcBJvsWAMMgxDzgRERpqt3X87pjQmTv3x4tJAaqGNS68RnhXm5qKYO6DYhvw4DQ3kFwATfLG0R0eeu6QOzjeEpoY3cPaqeMXsTxsFOU0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-sahara-border/60 bg-white p-10 shadow-ambient">
                <Bolt className="size-9 text-sahara-primary" />
                <h3 className="font-serif text-3xl font-bold">Instant Health Card</h3>
                <p className="leading-relaxed text-sahara-muted">
                  Your entire medical history, condensed into a secure and portable digital identity.
                </p>
              </div>

              <div className="space-y-4 rounded-xl bg-[#8c3c3c] p-10 text-white shadow-lg">
                <AlertTriangle className="size-9" />
                <h3 className="font-serif text-3xl font-bold">24/7 Emergency Support</h3>
                <p className="leading-relaxed text-rose-100/80">
                  Direct connection to critical care when every second counts. AI-assisted triage gets you help faster.
                </p>
              </div>

              <div className="rounded-xl border border-sahara-border/60 bg-white p-10 shadow-ambient md:col-span-2">
                <div className="grid items-center gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <MapPin className="size-9 text-sahara-primary" />
                    <h3 className="font-serif text-3xl font-bold">Global Care Map</h3>
                    <p className="leading-relaxed text-sahara-muted">
                      Find the nearest specialized healthcare provider or pharmacy within our verified network.
                    </p>
                  </div>
                  <div className="h-48 overflow-hidden rounded-lg border border-sahara-border bg-[#ece6dc]">
                    <img
                      className="h-full w-full object-cover"
                      alt="Map"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBadccNnyUiKEywECyw6bqyXDdcK2NUdyHAFBPEIo1k-gS9n4X-07CtK9Uj_O297UuP3csCKooZ6Ri24_KFwgIEs8EGKMaByyQej9-O4WY-fkKYGKXMFGP-UuwB6lbZH3T-elLUwr6SVakE2_nLi-EjeTQlvf8cr1TOpvgkobAgimrRzSer2vSCnBgokO2az1lL4s6BJOq8bu3oYQjRj4w-7cCEX4k36lGJhWHkhqY2HzECOxQMS8GlogdyA4tapUy4J-zyv7WYMjY"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="providers" className="mx-auto max-w-7xl px-8 py-24">
          <div className="relative flex flex-col items-center justify-between gap-12 overflow-hidden rounded-3xl bg-[#e6e0d6] p-12 lg:flex-row lg:p-20">
            <div className="z-10 space-y-6 text-center lg:max-w-xl lg:text-left">
              <h2 className="font-serif text-4xl font-bold lg:text-5xl">Are you a healthcare professional?</h2>
              <p className="text-lg leading-relaxed text-sahara-muted">
                Join our growing ecosystem of doctors and specialists using AI to spend less time on paperwork and more
                time with patients.
              </p>
              <Link
                href="/provider/verification"
                className="mx-auto inline-flex items-center justify-center gap-2 rounded-lg bg-sahara-fg px-8 py-4 font-bold text-sahara-bg transition-all hover:opacity-90 active:scale-[0.98] lg:mx-0"
              >
                Apply for Provider Status
                <Stethoscope className="size-4" />
              </Link>
            </div>
            <div className="z-10 grid grid-cols-2 gap-4">
              <div className="size-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <img
                  alt="Doctor 1"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBUp2D6fswf3-zNRkKXc8F5pae3iwW3ugayE5sfdQKwZ9GHWB7I87ir96ONlSgaD1Fh9ZwfWx7lyxHGRLIDgnBs39J5N7tujbZm11NIAWtpBED6vZgEljaWP5y-E3O3a_uA3MgtZVcR5l0-b-LV3iE4Feqpc3vj9jnESGarV7Xq50Hn4wp_abcYY_IFbCN6EgSNAU-jhemYdSJimlSEtEDKfr1Pk8zDhP0yeqpm8YydJDUyIUPbeMV2OA099TDy2DWbO4fZXyqopc"
                />
              </div>
              <div className="mt-8 size-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <img
                  alt="Doctor 2"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEV_TRMAu1w4ReFf1UhOio5n3KxjpfnJP3G8rdoVFU6t-KjTkp9R8atahinmAsgk5AtCgxpb-tc20UCsaK0LtaBTFKJefvXDqB3iZdjYj1SW-zcIW9lEXLePLwliR2_8Jyf4VoJOy9T1Ivyy6EO-4O2nNkhk2grXNJMZWQrwfjg2UFpMBeE3B5ZN5t-DYek9TZSCfdTWsPY0h1z_lSRFG-xnCHQcLGbx2uYy2BWESI8K44IqvxXa0ZD6XnGhHWFE6p9u1panGQ90I"
                />
              </div>
              <div className="-mt-4 size-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
                <img
                  alt="Doctor 3"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw-LGwJv61xKCL8z1ECKNnwYsrGuW-QDnku7zc6oJCwMp1pxw5hI36mm_QoW9B9-MPBnnFzyCTXGjrOYxjfskcOwNWJOO6tDL_Eonry94H-eAJx9dWV8677GF7Lanf4c7v7JbDj7MceGRmzpOub8ho4Pzxya7tRWraEuaQwra8uRYR9b1VkqMvnZVh3ZhfPedDGrmD6pBZZbqi3OVgo6mhO6UwFJKPlRSckN2i74xrt2nKPecZPu9qh-3xbptNyfmG87sS8f4qsyo"
                />
              </div>
            </div>
            <div className="absolute -right-12 -top-12 size-64 rounded-full bg-sahara-primary/10 blur-3xl" />
          </div>
        </section>
      </main>

      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-4 border-t border-sahara-border/60 bg-sahara-bg px-8 py-6 md:flex-row">
        <div className="text-xs text-sahara-muted">© 2024 MedBridge AI. Sun-baked simplicity for modern care.</div>
        <div className="flex space-x-6 text-xs text-sahara-muted">
          <a className="transition-colors hover:text-sahara-primary" href="/login">
            Privacy Policy
          </a>
          <a className="transition-colors hover:text-sahara-primary" href="/login">
            Terms of Service
          </a>
          <a className="transition-colors hover:text-sahara-primary" href="/doctor/assistant">
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  );
}
