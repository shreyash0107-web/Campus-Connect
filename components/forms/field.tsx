export function Field({ name, label, error, hint, children }: {
  name: string; label: string; error?: string[]; hint?: string; children: React.ReactNode;
}) {
  return <div className="field"><label className="label" htmlFor={name}>{label}</label>{children}
    <p id={`${name}-hint`} className={hint ? "helper" : "sr-only"}>{hint || ""}</p>
    {error?.[0] && <p id={`${name}-error`} className="field-error">{error[0]}</p>}
  </div>;
}
export function fieldA11y(name: string, errors?: Record<string, string[]>) {
  return { id: name, name, "aria-invalid": !!errors?.[name]?.length, "aria-describedby": errors?.[name]?.length ? `${name}-error` : `${name}-hint` };
}
