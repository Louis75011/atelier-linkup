import type { MailPreview } from '../lib/mail'

export function MailPreviewCard({ title, mail }: { title: string; mail: MailPreview }) {
  return (
    <section className="rounded-xl border border-line bg-white" aria-label={title}>
      <header className="border-b border-line px-4 py-2">
        <p className="eyebrow">{title}</p>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-sm">
          <dt className="text-muted">De</dt>
          <dd className="break-all">{mail.from}</dd>
          <dt className="text-muted">À</dt>
          <dd className="break-all">{mail.to}</dd>
          <dt className="text-muted">Objet</dt>
          <dd className="font-semibold">{mail.subject}</dd>
          <dt className="text-muted">Envoi</dt>
          <dd>{mail.when}</dd>
        </dl>
      </header>
      <pre className="whitespace-pre-wrap px-4 py-3 font-sans text-sm leading-relaxed">{mail.body}</pre>
      <p className="border-t border-line px-4 py-2 text-xs text-muted">Envoi simulé (Brevo) : aucun courriel ne part de ce démonstrateur.</p>
    </section>
  )
}
