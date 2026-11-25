export default function SectionGroup({ section, children }) {
  return (
    <section data-testid="section-group" className="mt-8">
      <h3 className="font-display text-lg font-semibold leading-tight">
        {section}
      </h3>
      <ul className="mt-2 divide-y divide-neutral-200">{children}</ul>
    </section>
  )
}
