import { PageHeader } from '../components/ui/Section'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../hooks/useSite'

export default function PrivacyPage() {
  const { name, contact } = useSite()
  usePageMeta({ title: 'Privacy Notice', description: `How ${name} handles information submitted through this website.` })

  return (
    <>
      <PageHeader crumbs={[{ label: 'Privacy notice' }]} title="Privacy notice" intro="How we handle the information you send us through this website." />
      <div className="container-page max-w-3xl space-y-8 py-14 text-[1.02rem] leading-8 text-muted">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-ink">What We Collect</h2>
          <p>
            When you submit an enquiry or contact form we collect the details you provide: your name, email address, optional phone number and
            organisation, your preferred contact method and the content of your message. We do not use advertising trackers on this site.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-ink">Why We Use It</h2>
          <p>
            We use these details only to respond to your enquiry, prepare a proposal you asked for, or tell you about a course you registered
            interest in. We do not sell your information or share it for marketing.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-ink">How It Is Stored</h2>
          <p>
            Enquiries are stored in our secured database and are accessible only to authorised staff through a password-protected
            administration area. If email notifications are enabled, a copy of your enquiry is sent to our business inbox. We keep enquiries
            only as long as needed to handle them and maintain business records.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-ink">Data You Share for Projects</h2>
          <p>
            Please do not upload or paste personal or confidential datasets into website forms. If a project needs data, we will agree a secure
            method and, where appropriate, a confidentiality agreement first.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-ink">Your Choices</h2>
          <p>
            You can ask us to correct or delete your enquiry details at any time
            {contact.email ? (
              <>
                {' '}by emailing{' '}
                <a className="link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </>
            ) : (
              ' by sending a message through the general contact form'
            )}
            . Quote your enquiry reference number if you have it.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-ink">Preferences Stored in Your Browser</h2>
          <p>We store your colour-theme choice (light, dark or system) in your browser's local storage. It is not sent to us.</p>
        </section>
      </div>
    </>
  )
}
