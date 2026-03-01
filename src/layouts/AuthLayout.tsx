import type { PropsWithChildren } from 'react'

interface AuthLayoutProps extends PropsWithChildren {
  title: string
}

export const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 via-slate-50 to-slate-100 px-4 py-8">
      <section aria-label={title} className="w-full max-w-md">
        {children}
      </section>
    </main>
  )
}
