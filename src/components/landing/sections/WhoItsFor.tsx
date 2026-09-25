const industries = [
  "FMCG",
  "Building materials",
  "Agri-inputs",
  "Pharma distribution",
  "Auto parts",
  "Electricals & durables",
];

export function WhoItsFor() {
  return (
    <section aria-labelledby="who-its-for" className="lp-rhythm-sm border-b border-border bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
        <h2 id="who-its-for" className="font-heading font-semibold text-[26px] md:text-[32px] text-foreground tracking-[-0.02em]">
          If you sell through dealers, Ledge fits.
        </h2>
        <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
          {industries.map((name) => (
            <li
              key={name}
              className="font-body text-[14px] font-medium text-foreground px-4 py-2 rounded-full bg-card border border-border shadow-depth-2"
            >
              {name}
            </li>
          ))}
        </ul>
        <p className="font-body text-[15px] text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">
          Not a shop billing app. Ledge is for businesses with dealers, salesmen and stock in more than one place.
        </p>
      </div>
    </section>
  );
}
