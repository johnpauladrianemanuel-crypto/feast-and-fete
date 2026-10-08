import React from 'react';
import InfoPageLayout from '@/app/components/InfoPageLayout';

const TERMS_SECTIONS = [
  {
    title: 'Using the site',
    body:
      'Use Feast & Fête’s website to browse the menu, manage your account, and submit legitimate orders. You are responsible for providing accurate contact, event, and fulfillment information and for keeping your sign-in details secure.',
  },
  {
    title: 'Orders, prices, and payment',
    body:
      'Submitting an order is a request for the items and schedule shown at checkout. An order is subject to availability and confirmation by Feast & Fête. Prices, serving details, and available payment options are displayed on the site and may change. If payment confirmation is required, the order will be reviewed before it is approved.',
  },
  {
    title: 'Pickup, delivery, and changes',
    body:
      'You are responsible for reviewing the event date, pickup or delivery method, address, contact details, and order summary before submitting. Fulfillment options and timing are subject to the availability shown at checkout. For a correction or change, contact Feast & Fête as soon as possible; requested changes are not guaranteed until confirmed.',
  },
  {
    title: 'Website content and service availability',
    body:
      'Menu descriptions and images are provided to help customers choose items; presentation may vary. We work to keep the site accurate and available, but occasional errors, interruptions, or changes may occur. These terms do not limit any rights that cannot legally be waived under applicable law.',
  },
  {
    title: 'Questions',
    body:
      'By using the site or submitting an order, you agree to these terms. For questions about an order or these terms, contact feastandfete@gmail.com.',
  },
];

export default function TermsOfServicePage() {
  return (
    <InfoPageLayout
      eyebrow="Ordering with us"
      title={<>Terms of <span className="text-secondary">Service</span></>}
      description="Please review these guidelines when browsing, using your account, or placing an order."
    >
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-12 sm:py-16">
        <p className="mb-6 text-sm text-muted-foreground">Last updated: October 8, 2026</p>
        {TERMS_SECTIONS.map(section => (
          <article key={section.title} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="font-display text-lg font-bold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </article>
        ))}
      </section>
    </InfoPageLayout>
  );
}
