import React from 'react';
import Link from 'next/link';
import InfoPageLayout from '@/app/components/InfoPageLayout';
import Icon from '@/components/ui/AppIcon';

const VALUES = [
  {
    icon: 'HeartIcon',
    title: 'Made for sharing',
    description: 'Generous Filipino favorites bring family and friends together around the table.',
  },
  {
    icon: 'SparklesIcon',
    title: 'A little less stress',
    description: 'A straightforward online ordering experience helps make celebration planning easier.',
  },
  {
    icon: 'TruckIcon',
    title: 'Here in Metro Manila',
    description: 'Plan your gathering with pickup or delivery options available during checkout.',
  },
];

export default function AboutPage() {
  return (
    <InfoPageLayout
      eyebrow="Our story"
      title={<>Good food makes <span className="text-secondary">gatherings</span></>}
      description="Feast & Fête brings authentic Filipino food trays to the celebrations that matter."
    >
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:gap-12">
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Feast &amp; Fête</p>
            <h2 className="font-display text-2xl font-black leading-tight text-foreground sm:text-3xl">
              Filipino favorites for life&apos;s milestones, big and small.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Since 2022, we&apos;ve been serving Metro Manila with food for birthdays, family reunions,
              fiestas, and all the moments worth celebrating. Our menu brings familiar Filipino
              favorites together in shareable trays, with clear item details to help you choose what
              works for your gathering.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              We believe planning the food should feel simple. Browse the menu, build your order, and
              choose pickup or delivery at checkout—so you can spend more time looking forward to
              being together.
            </p>
            <Link
              href="/menu-browse-screen"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore our menu
              <Icon name="ArrowRightIcon" size={16} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {VALUES.map(value => (
              <article key={value.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={value.icon} size={20} />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
