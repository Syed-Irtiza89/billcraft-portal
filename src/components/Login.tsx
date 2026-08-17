import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowRight, Feather, LockKeyhole } from 'lucide-react'

type DemoAccount = {
  email: string
  password: string
  role: string
  blurb: string
}

const DEMOS: DemoAccount[] = [
  {
    email: 'admin@northstar.dev',
    password: 'demo123',
    role: 'Agency admin',
    blurb: 'Both workspaces, clients, and the invoice builder.',
  },
  {
    email: 'client@acme.io',
    password: 'demo123',
    role: 'Acme client',
    blurb: 'View and download invoices issued to Acme Industries.',
  },
]

type LoginProps = {
  error: string | null
  onLogin: (email: string, password: string) => void
  onReset: () => void
}

export function Login({ error, onLogin, onReset }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLogin(email, password)
  }

  return (
    <div className="min-h-screen bg-cream text-ink lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-forest px-10 py-12 text-cream lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute -left-16 top-24 h-72 w-72 rounded-full border border-gold/30" />
          <div className="absolute -right-10 bottom-20 h-96 w-96 rounded-full border border-gold/20" />
        </div>
        <div>
          <p className="text-[11px] tracking-[0.35em] text-gold uppercase">Billcraft</p>
          <h1 className="mt-8 max-w-md font-display text-5xl leading-[1.1] font-semibold">
            Invoices with the calm of a well-set page.
          </h1>
          <div className="mt-8 h-px w-24 bg-gold" />
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-cream/75">
            A multi-tenant client portal for studios who still believe a bill can look like
            craft. Demo data lives in your browser — nothing leaves this machine.
          </p>
        </div>
        <article className="relative max-w-sm border border-gold/35 bg-forest-deep/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
          <p className="text-[10px] tracking-[0.28em] text-gold uppercase">Invoice</p>
          <p className="mt-2 font-display text-2xl">INV-2026-0007</p>
          <div className="mt-4 h-px bg-gold/40" />
          <div className="mt-4 flex justify-between text-xs text-cream/70">
            <span>Northstar Studio</span>
            <span className="tabular-nums">$18,400.00</span>
          </div>
          <p className="mt-6 text-[11px] tracking-[0.2em] text-gold/80 uppercase">Paid · August ledger</p>
        </article>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <p className="text-[11px] tracking-[0.35em] text-gold uppercase">Billcraft</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-forest">Client portal</h1>
          </div>
          <div className="flex items-center gap-2 text-forest">
            <LockKeyhole size={16} strokeWidth={1.5} />
            <p className="text-sm tracking-wide">Sign in to your workspace</p>
          </div>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-[11px] tracking-[0.22em] text-muted uppercase">Email</span>
              <input
                className="mt-2 w-full border border-forest/15 bg-white/60 px-3 py-2.5 text-sm outline-none transition focus:border-gold"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[11px] tracking-[0.22em] text-muted uppercase">Password</span>
              <input
                className="mt-2 w-full border border-forest/15 bg-white/60 px-3 py-2.5 text-sm outline-none transition focus:border-gold"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-[#9a3b2f]">{error}</p> : null}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-forest px-4 py-3 text-sm tracking-wide text-cream transition hover:bg-forest-mid"
            >
              Enter ledger
              <ArrowRight size={16} strokeWidth={1.6} />
            </button>
          </form>

          <div className="mt-10 h-px w-full bg-gold/50" />
          <p className="mt-6 flex items-center gap-2 text-[11px] tracking-[0.22em] text-muted uppercase">
            <Feather size={14} strokeWidth={1.5} />
            Demo accounts
          </p>
          <ul className="mt-4 space-y-3">
            {DEMOS.map((demo) => (
              <li key={demo.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(demo.email)
                    setPassword(demo.password)
                    onLogin(demo.email, demo.password)
                  }}
                  className="w-full border border-forest/10 bg-white/50 px-4 py-3 text-left transition hover:border-gold/70 hover:bg-white"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-forest">{demo.role}</span>
                    <span className="font-mono text-[11px] text-muted">{demo.password}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink">{demo.email}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{demo.blurb}</p>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onReset}
            className="mt-8 text-xs tracking-wide text-muted underline decoration-gold/60 underline-offset-4 hover:text-forest"
          >
            Reset demo data
          </button>
        </div>
      </section>
    </div>
  )
}
