// src/app/style-test/page.tsx
export default function StyleTestPage() {
  return (
    <main className="min-h-[70vh] px-4 py-10">
      {/* Tailwind utility test */}
      <section className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Tailwind + daisyUI Pipeline Test
        </h1>
        <p className="text-base opacity-80 mb-6">
          If you can see colours, spacing, and components styled below, Tailwind
          v4 and daisyUI are working.
        </p>

        {/* Tailwind utilities */}
        <div className="rounded-2xl p-6 mb-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">
          <p className="text-lg">This gradient box uses Tailwind utilities.</p>
        </div>

        {/* daisyUI: buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="btn">Default</button>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-accent">Accent</button>
          <button className="btn btn-outline">Outline</button>
        </div>

        {/* daisyUI: alert + badge */}
        <div className="alert alert-info mb-8">
          <span>Info alert from daisyUI. Tailwind classes also applied.</span>
          <span className="badge badge-neutral">badge</span>
        </div>

        {/* daisyUI: card */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card bg-base-200 shadow">
            <div className="card-body">
              <h2 className="card-title">Card Title</h2>
              <p>Cards, alerts, buttons etc. come from daisyUI.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Action</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow">
            <div className="card-body">
              <h2 className="card-title">Another Card</h2>
              <p>If this looks styled, the plugin is active.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-secondary">Action</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
