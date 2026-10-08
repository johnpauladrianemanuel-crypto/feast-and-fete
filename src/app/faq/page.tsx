import React from 'react';
import Link from 'next/link';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import LandingFooter from '@/app/components/LandingFooter';
import Icon from '@/components/ui/AppIcon';

const FAQS = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse the menu, add your favorites to the cart, then continue to checkout. Choose pickup or delivery, provide your event details, and review everything before submitting your order.',
  },
  {
    question: 'How far in advance should I order?',
    answer:
      'Orders placed by 12 noon are prepared for next-day service. If you are ordering after the daily cutoff, check the available date at checkout before submitting.',
  },
  {
    question: 'Can I choose pickup or delivery?',
    answer:
      'Yes. Select an available fulfillment method during checkout. For delivery, enter your complete address; for pickup, follow the pickup details shown with your order.',
  },
  {
    question: 'What payment methods can I use?',
    answer:
      'Available payment options are shown during checkout. If you select GCash or bank transfer, upload your payment proof when prompted. Orders requiring payment verification are approved after the payment is confirmed.',
  },
  {
    question: 'Can I order without creating an account?',
    answer:
      'Yes. Choose the guest option on the sign-in page and verify your Gmail address to continue as a guest.',
  },
  {
    question: 'How can I check my order status?',
    answer:
      'Sign in and open My Orders to review your orders. If you checked out as a guest, use the order number shown on your confirmation page to look up your order on the Order Status page.',
  },
  {
    question: 'How do I know the tray size or serving amount?',
    answer:
      'Open a menu item to see its description, price, and serving-size information before adding it to your cart.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />
      <main>
        <section className="relative overflow-hidden bg-[#2C1810]">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative mx-auto max-w-screen-2xl px-4 py-16 sm:py-20 lg:px-8 xl:px-10 2xl:px-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Here to help</p>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
              Frequently Asked <span className="text-secondary">Questions</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
              Quick answers to help you plan your next Feast &amp; Fête celebration.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors open:border-primary/30 sm:p-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold text-foreground marker:hidden sm:text-lg">
                  <span>{faq.question}</span>
                  <Icon
                    name="PlusIcon"
                    size={19}
                    className="shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                  />
                </summary>
                <p className="mt-4 max-w-3xl pr-6 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-primary/15 bg-primary/5 px-6 py-8 text-center sm:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name="ChatBubbleLeftRightIcon" size={23} />
            </div>
            <h2 className="mt-4 font-display text-xl font-black text-foreground sm:text-2xl">
              Still have a question?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              We&apos;re happy to help with your order or celebration plans.
            </p>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=feastandfete%40gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Icon name="EnvelopeIcon" size={16} />
              Contact us
            </a>
            <div>
              <Link
                href="/menu-browse-screen"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Browse the menu
                <Icon name="ArrowRightIcon" size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
