export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-20 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-white/[0.05]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Our Story
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            About Vitamin Shop
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
            We believe that superior health starts with superior ingredients. That&apos;s why
            every product we offer is held to the highest standard of purity and efficacy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-16 space-y-16">

        {/* Mission */}
        <section className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:items-center">
          <div>
            <span className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
              Our Mission
            </span>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Health that you can trust, delivered to your door
            </h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              Vitamin Shop was founded with a single purpose: to make premium, science-backed
              nutrition accessible to everyone. We saw a market flooded with products that made
              bold promises but cut corners on quality. We decided to do things differently.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              From our first product launch, we committed to sourcing only the finest raw
              materials, partnering with certified suppliers, and subjecting every batch to
              rigorous third-party lab testing before it ever reaches your hands.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 p-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-28 w-28 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.704-3.08z"
              />
            </svg>
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="text-center">
            <span className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
              Our Values
            </span>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">What sets us apart</h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L4.2 15.3m15.6 0l-1.98 2.971A2.25 2.25 0 0 1 15.6 19.5H8.4a2.25 2.25 0 0 1-1.86-.679L4.2 15.3" />
                  </svg>
                ),
                title: 'Lab Tested & Certified',
                body:
                  'Every product undergoes independent third-party testing for potency, purity, and the absence of contaminants. You receive a certificate of analysis with every order.',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                ),
                title: 'Premium Ingredients',
                body:
                  'We work directly with trusted raw-material suppliers, selecting the bioavailable forms of each nutrient so your body can actually absorb what you take.',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: 'Fast & Reliable Delivery',
                body:
                  'Orders placed before 2 PM ship same-day. We partner with leading carriers to ensure your supplements arrive quickly and in perfect condition, wherever you are.',
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:p-12">
          <span className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
            Our Story
          </span>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            From a small idea to a trusted brand
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-gray-600">
            <p>
              Vitamin Shop started in 2019 when our founders, frustrated by the opacity of the
              supplement industry, decided to build something better. They gathered a small team
              of nutritionists, biochemists, and wellness advocates and set out to create a
              brand where transparency was non-negotiable.
            </p>
            <p>
              Our first product, a highly bioavailable magnesium glycinate, sold out in under
              48 hours. Customer feedback was clear: people were hungry for products they could
              actually trust. We listened, and we grew — but we never compromised on the
              principles that made us who we are.
            </p>
            <p>
              Today, Vitamin Shop offers an ever-expanding catalog of vitamins, minerals,
              proteins, omega-3 fatty acids, and herbal supplements, all manufactured in
              GMP-certified facilities and backed by transparent, third-party lab results.
              We ship to customers across the globe, but our commitment to each individual
              remains as personal as it was on day one.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '50+', label: 'Products' },
              { value: '120K+', label: 'Happy Customers' },
              { value: '99.8%', label: 'Purity Guarantee' },
              { value: '4.9★', label: 'Average Rating' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
              >
                <p className="text-3xl font-extrabold text-emerald-600">{value}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}