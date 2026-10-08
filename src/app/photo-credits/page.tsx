import React from 'react';
import InfoPageLayout from '@/app/components/InfoPageLayout';

const PHOTO_CREDITS = [
  {
    item: 'Buko Pandan',
    creator: 'Ralff Nestor Nacor',
    source: 'https://commons.wikimedia.org/wiki/File:Buko_Pandan,_July_2025.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    item: "Sago't Gulaman",
    creator: 'Mark Guim',
    source: 'https://commons.wikimedia.org/wiki/File:Sago_Gulaman.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    item: 'Calamansi drink',
    creator: 'RightCowLeftCoast',
    source: 'https://commons.wikimedia.org/wiki/File:Calamansi_Mint_Mexipino_Craft_drink.jpg',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    item: 'Salabat',
    creator: 'Yvette Tan',
    source: 'https://commons.wikimedia.org/wiki/File:Pampanga_Prado_Farm_-_Ginger_Tea,_Salabat.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    item: 'Chopsuey',
    creator: 'Ralff Nestor Nacor',
    source: 'https://commons.wikimedia.org/wiki/File:Chopsuey_from_the_Philippines.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    item: 'Chicken Afritada',
    creator: 'Judgefloro',
    source: 'https://commons.wikimedia.org/wiki/File:0050jfCuisine_Foods_Philippines_Baliuag_Bulacanfvf_17.jpg',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
];

export default function PhotoCreditsPage() {
  return (
    <InfoPageLayout
      eyebrow="Image acknowledgements"
      title={<>Photo <span className="text-secondary">Credits</span></>}
      description="We’re grateful to the photographers who share their work. Product photos listed below are reproduced unchanged."
    >
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="space-y-3">
          {PHOTO_CREDITS.map(credit => (
            <article
              key={credit.item}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">{credit.item}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Photo by {credit.creator}</p>
              </div>
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
            </article>
          ))}
        </div>
      </section>
    </InfoPageLayout>
  );
}
