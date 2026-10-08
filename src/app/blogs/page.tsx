import React from 'react';
import Link from 'next/link';
import InfoPageLayout from '@/app/components/InfoPageLayout';
import Icon from '@/components/ui/AppIcon';

const ARTICLES = [
  {
    id: 'plan-a-filipino-celebration-menu',
    category: 'Celebration planning',
    title: 'How to plan a Filipino celebration menu',
    intro: 'A few thoughtful choices can make a shared table feel complete.',
    paragraphs: [
      'Start with the occasion and the people you’re bringing together. A family lunch, birthday, and evening celebration may call for different combinations, so use your guest list and event schedule as a guide.',
      'Build variety into the spread. Pair familiar mains with sides and something sweet, and consider different preferences when choosing dishes. Menu descriptions and serving-size details can help you compare options.',
      'When your menu is ready, place your order ahead of time and review the pickup or delivery details at checkout. A little planning leaves more room to enjoy the celebration.',
    ],
    link: '/menu-browse-screen',
    linkText: 'Browse the menu',
  },
  {
    id: 'choosing-tray-sizes',
    category: 'Ordering tips',
    title: 'Choosing food trays for your gathering',
    intro: 'Use serving information, menu variety, and your guest list to guide your choices.',
    paragraphs: [
      'There’s no one-size-fits-all menu. Think about how many guests you’re expecting and whether the trays will be the main meal or part of a larger spread.',
      'Check each menu item’s serving-size information and description before adding it to your cart. A mix of categories can give guests more choices, especially for a longer gathering.',
      'If you’re unsure about a dish or your order details, get in touch before checkout. It’s easier to make adjustments while you’re still planning.',
    ],
    link: '/contact',
    linkText: 'Ask us a question',
  },
  {
    id: 'order-ahead',
    category: 'Order guide',
    title: 'Why ordering ahead makes celebrations easier',
    intro: 'A little lead time helps you review the details before the big day.',
    paragraphs: [
      'Placing a pre-order gives you time to select your dishes, set the event date, and check your fulfillment details without leaving everything to the last minute.',
      'Orders placed by 12 noon are prepared for next-day service. Availability and dates can vary, so confirm the options shown during checkout before submitting your order.',
      'After checkout, keep your order number handy. You can use it to check order status, and signed-in customers can also review orders from My Orders.',
    ],
    link: '/faq',
    linkText: 'Read ordering FAQs',
  },
];

export default function BlogsPage() {
  return (
    <InfoPageLayout
      eyebrow="From our table"
      title={<>Ideas for your next <span className="text-secondary">gathering</span></>}
      description="Planning tips and ordering guides to help make sharing good food a little easier."
    >
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-5">
          {ARTICLES.map(article => (
            <article
              key={article.id}
              id={article.id}
              className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{article.category}</p>
              <h2 className="mt-3 font-display text-2xl font-black text-foreground sm:text-3xl">{article.title}</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{article.intro}</p>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {article.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <Link
                href={article.link}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                {article.linkText}
                <Icon name="ArrowRightIcon" size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </InfoPageLayout>
  );
}
