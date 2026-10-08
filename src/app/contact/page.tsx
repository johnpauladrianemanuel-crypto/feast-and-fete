import React from 'react';
import Link from 'next/link';
import InfoPageLayout from '@/app/components/InfoPageLayout';
import Icon from '@/components/ui/AppIcon';

export default function ContactPage() {
  return (
    <InfoPageLayout
      eyebrow="Get in touch"
      title={<>Let&apos;s plan your <span className="text-secondary">feast</span></>}
      description="Questions about the menu or your upcoming order? Send us an email and we’ll be glad to help."
    >
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=feastandfete%40gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg sm:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name="EnvelopeIcon" size={23} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Email us</p>
            <h2 className="mt-2 break-all font-display text-xl font-black text-foreground group-hover:text-primary sm:text-2xl">
              feastandfete@gmail.com
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Open a Gmail compose window to send us a message.            </p>
          </a>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-primary">
              <Icon name="MapPinIcon" size={21} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Pickup information</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pickup is at 12 Mariposa St., Quezon City, Metro Manila. Please bring your order ID.
                Your selected pickup or delivery details will also appear during checkout.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Need help with ordering or payment?</p>
          <Link href="/faq" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Visit our FAQs
            <Icon name="ArrowRightIcon" size={15} />
          </Link>
        </div>
      </section>
    </InfoPageLayout>
  );
}
