'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useSiteContent } from '@/context/ContentContext';

interface ContactProps {
  locale: string;
}

export function Contact({ locale }: ContactProps) {
  const t = useTranslations('contact');
  const tForm = useTranslations('contact.form');
  const tInfo = useTranslations('contact.info');
  const { content } = useSiteContent();
  const lang = locale === 'en' ? 'en' : 'id';

  const addressContent =
    (lang === 'en'
      ? content.contact?.addressContent?.en || content.contact?.addressContent?.id
      : content.contact?.addressContent?.id || content.contact?.addressContent?.en) ||
    tInfo('addressContent');
  const emailValue = content.contact?.emailValue || tInfo('emailValue');
  const phoneValue = content.contact?.phoneValue || tInfo('phoneValue');
  const hoursValue =
    (lang === 'en'
      ? content.contact?.hoursValue?.en || content.contact?.hoursValue?.id
      : content.contact?.hoursValue?.id || content.contact?.hoursValue?.en) ||
    tInfo('hoursValue');
  const mapUrl = content.contact.mapUrl || 'https://maps.google.com/maps?q=Universitas%20Mataram%20Jl.%20Majapahit%20No.62&t=&z=15&ie=UTF8&iwloc=&output=embed';
  const socialInstagram = content.contact.socialInstagram || '';
  const socialLinkedin = content.contact.socialLinkedin || '';
  const socialYoutube = content.contact.socialYoutube || '';
  const socialWhatsapp = content.contact.socialWhatsapp || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'study',
    message: '',
    botcheck: false,
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const web3formsKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
  const isWeb3FormsConfigured = Boolean(
    web3formsKey &&
    web3formsKey.trim() !== '' &&
    web3formsKey !== 'TODO_REPLACE_WITH_REAL_WEB3FORMS_KEY'
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Honeypot anti-spam check (DESIGN.md Section 7)
    if (formData.botcheck) {
      return;
    }

    if (!isWeb3FormsConfigured) {
      console.warn('Web3Forms key is not configured. Redirecting to mailto fallback.');
      const subjectEncoded = encodeURIComponent(`[IAO UNRAM Inquiry] ${formData.subject}: ${formData.name}`);
      const bodyEncoded = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nTopic: ${formData.subject}\n\nMessage:\n${formData.message}`
      );
      window.location.href = `mailto:io@unram.ac.id?subject=${subjectEncoded}&body=${bodyEncoded}`;
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          name: formData.name,
          email: formData.email,
          subject: `[IAO UNRAM Inquiry] ${formData.subject}: ${formData.name}`,
          message: formData.message,
          from_name: 'IAO UNRAM Website Contact Form',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: 'study',
          message: '',
          botcheck: false,
        });
      } else {
        setStatus('error');
        setErrorMessage(result.message || tForm('errorDesc'));
      }
    } catch {
      setStatus('error');
      setErrorMessage(tForm('errorDesc'));
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-unram-50 border-b border-hairline">
      <Container>
        {/* Section Heading with Numbered Eyebrow (DESIGN.md) */}
        <SectionHeading
          kicker={`09 — ${t('kicker')}`}
          title={t('title')}
          subtitle={t('subtitle')}
          className="mb-14 lg:mb-16"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Office Details, Map & Social Text Links (DESIGN.md Section 7) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Institutional Information Block */}
            <div className="bg-surface p-7 sm:p-8 rounded-[4px] border border-hairline space-y-5">
              <div>
                <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft mb-1">
                  {tInfo('addressTitle')}
                </h4>
                <p className="text-sm text-ink leading-relaxed">
                  {addressContent}
                </p>
              </div>

              <div className="pt-4 border-t border-hairline">
                <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft mb-1">
                  {tInfo('emailTitle')}
                </h4>
                <a
                  href={`mailto:${emailValue}`}
                  className="text-sm font-semibold text-unram-600 hover:underline underline-offset-4"
                >
                  {emailValue}
                </a>
              </div>

              <div className="pt-4 border-t border-hairline">
                <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft mb-1">
                  {tInfo('phoneTitle')}
                </h4>
                <p className="text-sm text-ink font-medium">
                  {phoneValue}
                </p>
              </div>

              <div className="pt-4 border-t border-hairline">
                <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft mb-1">
                  {tInfo('hoursTitle')}
                </h4>
                <p className="text-sm text-ink-soft">
                  {hoursValue}
                </p>
              </div>

              {/* Social Links as plain text links with arrows, NO colored icons (DESIGN.md Section 7) */}
              <div className="pt-4 border-t border-hairline">
                <h4 className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-soft mb-2">
                  {locale === 'en' ? 'Connect With Us' : 'Kanal Komunikasi'}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-unram-600">
                  {socialInstagram && (
                    <>
                      <a
                        href={socialInstagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline underline-offset-4"
                      >
                        <span>Instagram</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                      <span className="text-hairline">/</span>
                    </>
                  )}
                  {socialLinkedin && (
                    <>
                      <a
                        href={socialLinkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline underline-offset-4"
                      >
                        <span>LinkedIn</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                      <span className="text-hairline">/</span>
                    </>
                  )}
                  {socialYoutube && (
                    <>
                      <a
                        href={socialYoutube}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline underline-offset-4"
                      >
                        <span>YouTube</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                      <span className="text-hairline">/</span>
                    </>
                  )}
                  {socialWhatsapp && (
                    <a
                      href={socialWhatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline underline-offset-4"
                    >
                      <span>WhatsApp</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Embedded Google Map (Bordered 4px radius box per DESIGN.md Section 7) */}
            <div className="rounded-[4px] overflow-hidden border border-hairline bg-surface">
              <iframe
                title={tInfo('mapTitle')}
                src={mapUrl}
                width="100%"
                height="210"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </motion.div>

          {/* Right Column: Web3Forms Contact Form (DESIGN.md Section 7) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="lg:col-span-7 bg-surface p-7 sm:p-10 rounded-[4px] border border-hairline"
          >
            <div className="mb-7">
              <h3 className="font-serif text-2xl font-normal text-ink">
                {tForm('title')}
              </h3>
              <p className="text-sm text-ink-soft mt-1 leading-[1.6]">
                {tForm('subtitle')}
              </p>
            </div>

            {status === 'success' ? (
              <div className="p-6 rounded-[4px] bg-unram-50 border border-hairline text-ink animate-in fade-in duration-200">
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-unram-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-sm text-ink">
                      {tForm('successTitle')}
                    </h4>
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {tForm('successDesc')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="mt-2 inline-flex items-center text-xs font-semibold text-unram-600 underline underline-offset-4 hover:text-unram-800"
                    >
                      {tForm('sendAnother')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot field (hidden anti-spam) */}
                <input
                  type="checkbox"
                  name="botcheck"
                  checked={formData.botcheck}
                  onChange={(e) =>
                    setFormData({ ...formData, botcheck: e.target.checked })
                  }
                  className="hidden"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {status === 'error' && (
                  <div className="p-4 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">{tForm('errorTitle')}</p>
                      <p className="text-rose-700 mt-0.5">
                        {errorMessage || tForm('errorDesc')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Name & Email Inputs (48px height, 6px radius, 1px hairline border per DESIGN.md Section 6) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium uppercase tracking-[0.12em] text-ink mb-1.5"
                    >
                      {tForm('nameLabel')} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder={tForm('namePlaceholder')}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full h-12 px-4 text-sm rounded-[6px] bg-surface border border-hairline text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-unram-600 focus:ring-offset-2 transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium uppercase tracking-[0.12em] text-ink mb-1.5"
                    >
                      {tForm('emailLabel')} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder={tForm('emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full h-12 px-4 text-sm rounded-[6px] bg-surface border border-hairline text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-unram-600 focus:ring-offset-2 transition-colors"
                    />
                  </div>
                </div>

                {/* Subject Topic Select */}
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-medium uppercase tracking-[0.12em] text-ink mb-1.5"
                  >
                    {tForm('subjectLabel')} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="contact-subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full h-12 px-4 text-sm rounded-[6px] bg-surface border border-hairline text-ink focus:outline-none focus:ring-2 focus:ring-unram-600 focus:ring-offset-2 transition-colors"
                  >
                    <option value="study">{tForm('subjectOptions.study')}</option>
                    <option value="outbound">{tForm('subjectOptions.outbound')}</option>
                    <option value="partnership">{tForm('subjectOptions.partnership')}</option>
                    <option value="visa">{tForm('subjectOptions.visa')}</option>
                    <option value="other">{tForm('subjectOptions.other')}</option>
                  </select>
                </div>

                {/* Message Textarea */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium uppercase tracking-[0.12em] text-ink mb-1.5"
                  >
                    {tForm('messageLabel')} <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder={tForm('messagePlaceholder')}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full p-4 text-sm rounded-[6px] bg-surface border border-hairline text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-unram-600 focus:ring-offset-2 transition-colors resize-y"
                  />
                </div>

                {/* Notice for mailto fallback if Web3Forms key not configured */}
                {!isWeb3FormsConfigured && (
                  <div className="p-3.5 rounded-[4px] border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {locale === 'en' ? 'Direct Email Delivery Active' : 'Pengiriman Email Langsung Aktif'}
                      </p>
                      <p className="text-amber-800 mt-0.5 leading-relaxed">
                        {locale === 'en'
                          ? 'Inquiries will be composed directly to io@unram.ac.id.'
                          : 'Pesan akan diarahkan langsung melalui email resmi io@unram.ac.id.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit CTA Button (DESIGN.md: Primary --accent fill, --ink text, 6px radius, weight 600) */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[6px] bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold text-xs uppercase tracking-wider transition-colors"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>{tForm('sendingBtn')}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {!isWeb3FormsConfigured
                          ? (locale === 'en' ? 'Send via Email (mailto)' : 'Kirim via Email')
                          : tForm('submitBtn')}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
