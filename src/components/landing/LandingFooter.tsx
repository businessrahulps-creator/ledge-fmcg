export function LandingFooter() {
  const columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Contact", href: "mailto:hello@ordra.in" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#1E1E2C] py-16 px-6 bg-[#08080D]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <span className="font-heading font-extrabold text-xl tracking-[-0.04em] text-[#F2F2F5]">Ledge</span>
            </div>
            <p className="text-sm text-[#55556A] leading-relaxed">
              Sales captured. Distributors managed.
              <br />
              Payments tracked.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-medium text-[#F2F2F5] mb-4">{col.title}</div>
              <div className="space-y-3">
                {col.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="block text-sm text-[#55556A] hover:text-[#F2F2F5] transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#1E1E2C] pt-8 text-sm text-[#55556A] text-center">
          © {new Date().getFullYear()} Ordra. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
