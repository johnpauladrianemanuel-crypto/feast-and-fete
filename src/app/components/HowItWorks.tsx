import React from 'react';

const STEPS = [
  { num: '01', icon: '🍽️', title: 'Browse the Menu', desc: 'Explore 22+ authentic Filipino food trays across 8 categories. Filter by type, sort by price, read full descriptions.' },
  { num: '02', icon: '🛒', title: 'Add to Cart', desc: 'Select your trays, adjust quantities, and review your order before proceeding to checkout.' },
  { num: '03', icon: '📋', title: 'Place Pre-Order', desc: 'Choose pickup or delivery, select your date and time, and upload your GCash or bank transfer proof.' },
  { num: '04', icon: '🎉', title: 'Enjoy Your Feast', desc: 'We prepare everything fresh. Track your order status in real time and receive it right on time.' },
];

export default function HowItWorks() {
  return (
    <section className="hiw-v2-root py-24 relative overflow-hidden">
      {/* Large watermark text */}
      <div className="hiw-v2-watermark absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-display font-black text-[20vw] leading-none opacity-[0.025] text-gray-900 dark:text-white whitespace-nowrap">
          HOW IT WORKS
        </span>
      </div>
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="hiw-v2-eyebrow text-xs font-bold tracking-[0.3em] uppercase mb-3">Simple Process</p>
          <h2 className="font-display text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            How It <span className="hiw-v2-accent">Works</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-4 max-w-md mx-auto">
            No more Messenger threads or missed calls — ordering your feast is now effortless.
          </p>
        </div>

        {/* Steps — alternating heights with connecting line */}
        <div className="relative">
          {/* Connecting dashed line */}
          <div className="hiw-v2-line hidden lg:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 pointer-events-none" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS?.map((step, i) => (
              <div
                key={step?.num}
                className={`hiw-v2-card group relative rounded-3xl p-7 flex flex-col gap-5 ${
                  i % 2 === 1 ? 'lg:mt-10' : ''
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Big step number watermark */}
                <div className="hiw-v2-num-bg absolute top-4 right-5 font-display font-black text-6xl leading-none select-none pointer-events-none">
                  {step?.num}
                </div>

                {/* Icon */}
                <div className="hiw-v2-icon-wrap w-16 h-16 rounded-2xl flex items-center justify-center text-3xl relative z-10">
                  {step?.icon}
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-2">
                  <h3 className="font-display text-lg font-black text-gray-900 dark:text-white leading-tight">{step?.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step?.desc}</p>
                </div>

                {/* Step indicator dot */}
                <div className="hiw-v2-dot hidden lg:flex absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full items-center justify-center z-20">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}