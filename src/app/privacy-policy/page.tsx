import React from 'react';
import InfoPageLayout from '@/app/components/InfoPageLayout';

const POLICY_SECTIONS = [
  {
    title: 'Information we collect',
    body:
      'When you create an account or place an order, we may collect information you provide, such as your name, email address, phone number, delivery address, order details, and payment confirmation documents. Guest orders may also use the contact details you provide to identify and manage your order.',
  },
  {
    title: 'How we use your information',
    body:
      'We use this information to manage accounts, prepare and fulfill orders, confirm payments, provide order updates, respond to questions, and improve the ordering experience. We do not sell your personal information. Information may be processed by service providers that help operate the site and its ordering features.',
  },
  {
    title: 'Your choices and contacting us',
    body:
      'Please provide accurate information and avoid sending sensitive details that are not needed to process your order. You may contact us to ask about or request an update to your account information. We use reasonable safeguards for information handled through the service, but no online service can guarantee absolute security. For privacy questions, email feastandfete@gmail.com.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <InfoPageLayout
      eyebrow="Your information"
      title={<>Privacy <span className="text-secondary">Policy</span></>}
      description="A clear overview of the information used to provide Feast & Fête’s ordering service."
    >
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-12 sm:py-16">
        <p className="mb-6 text-sm text-muted-foreground">Last updated: October 8, 2026</p>
        {POLICY_SECTIONS.map(section => (
          <article key={section.title} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="font-display text-lg font-bold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </article>
        ))}
      </section>
    </InfoPageLayout>
  );
}
