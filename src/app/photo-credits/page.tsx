import React from 'react';
import InfoPageLayout from '@/app/components/InfoPageLayout';

const PHOTO_CREDITS: {
  item: string;
  creator: string;
  source?: string;
  license?: string;
  licenseUrl?: string;
}[] = [
  {
    item: 'Buko Pandan',
    creator: 'Ralff Nestor Nacor',
    source: 'https://commons.wikimedia.org/wiki/File:Buko_Pandan,_July_2025.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  { item: "Sago't Gulaman", creator: 'Project owner' },
  { item: 'Calamansi Juice Pitcher', creator: 'Project owner' },
  { item: 'Iced Salabat (Ginger Tea)', creator: 'Project owner' },
  { item: 'Chopsuey', creator: 'Project owner' },
  { item: 'Chicken Afritada', creator: 'Project owner' },
  { item: 'Baked Macaroni Filipino-Style', creator: 'Project owner' },
  { item: 'Seafood Kare-Kare', creator: 'Project owner' },
];

export default function PhotoCreditsPage() {
  return (
    <InfoPageLayout
      eyebrow="Image acknowledgements"
      title={<>Photo <span className="text-secondary">Credits</span></>}
      description="Product photos supplied by the project owner are identified below."
    >
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="space-y-3">
          {PHOTO_CREDITS.map((credit) => (
            <article
              key={credit.item}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">{credit.item}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {credit.creator === 'Project owner'
                    ? 'Photo supplied by the project owner'
                    : `Photo by ${credit.creator}`}
                </p>
              </div>
              {credit.source && credit.license && credit.licenseUrl && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <a
                    href={credit.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    View source
                  </a>
                  <a
                    href={credit.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {credit.license} license
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </InfoPageLayout>
  );
}
