export function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div className="min-w-0">{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="text-[28px] leading-tight font-semibold tracking-[-.04em] sm:text-[30px]">{title}</h1><p className="mt-2 text-[13px] leading-6 text-muted">{description}</p></div>{children}</div>;
}
