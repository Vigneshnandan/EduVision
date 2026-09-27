import { login } from './actions'
import { Shield, AlertCircle, KeyRound, Building2 } from 'lucide-react'

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams
  const error = typeof searchParams.error === 'string' ? searchParams.error : null

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 md:p-10 shadow-2xl border border-slate-200">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-1">
              State Government Command Portal
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Admin Login</h2>
            <p className="text-xs text-slate-500 mt-1">Multi-Tenant Education Directorate Administration</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div className="font-medium">{decodeURIComponent(error)}</div>
          </div>
        )}

        <form className="mt-6 space-y-4" action={login}>
          <div>
            <label htmlFor="email-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue="admin@eduvision.com"
              required
              className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="admin@eduvision.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Secure Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue="AdminPassword123!"
              required
              className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              placeholder="••••••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Sign In to Command Portal
            </button>
          </div>
        </form>

        {/* Credentials Info Note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <KeyRound className="h-3.5 w-3.5 text-blue-600" />
            <span>Configured Platform Admin Credentials:</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 select-all space-y-0.5">
            <div><span className="text-slate-400">Email:</span> admin@eduvision.com</div>
            <div><span className="text-slate-400">Pass:</span> AdminPassword123!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
