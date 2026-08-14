import Link from 'next/link'

export default function HomePage() {
  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(180deg,_#fffef8_0%,_#ffffff_45%)] px-4 py-10 sm:px-6 lg:px-8'>
      <div className='mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <section className='rounded-[2rem] border bg-white/88 p-8 shadow-sm lg:p-10'>
          <p className='text-sm uppercase tracking-[0.2em] text-amber-700'>DynamoDB MVP</p>
          <h1 className='mt-4 text-5xl font-semibold tracking-tight text-balance'>
            Customer storefront and protected admin console in one Next.js app.
          </h1>
          <p className='mt-5 max-w-2xl text-base leading-7 text-muted-foreground'>
            Browse the public catalog as a customer, or sign into the admin area to manage
            products and categories through Cognito, API Gateway, Lambda, and NestJS RBAC.
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Link
              href='/customer/products'
              className='inline-flex items-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90'
            >
              Enter catalog
            </Link>
            <Link
              href='/admin'
              className='inline-flex items-center rounded-full border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted'
            >
              Open admin
            </Link>
          </div>
        </section>

        <section className='rounded-[2rem] border bg-slate-950 p-8 text-white shadow-sm'>
          <p className='text-sm uppercase tracking-[0.2em] text-white/60'>What changed</p>
          <ul className='mt-5 space-y-4 text-sm leading-6 text-white/76'>
            <li>Public `/customer/products` catalog with filters, pagination, and detail pages</li>
            <li>Protected `/admin` workspace with Cognito-backed session management</li>
            <li>Dual login paths: Hosted UI and custom credential form</li>
            <li>JWT verification at API Gateway plus role enforcement inside NestJS</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
