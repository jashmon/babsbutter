// "Why the fridge fights over it" — bouncy icon tiles.
export interface Why {
  icon: string;
  title: string;
  body: string;
}

export const why: Why[] = [
  {
    icon: '/assets/illus/butter-swirl.svg',
    title: 'Slow-churned',
    body: "Low and slow keeps the cream's character. Fast factories can't say that.",
  },
  {
    icon: '/assets/illus/exclamation.svg',
    title: 'Zero nasties',
    body: 'No palm oil, no fillers, no flavourings pretending to be food.',
  },
  {
    icon: '/assets/illus/hearts.svg',
    title: 'Family approved',
    body: 'One tub the whole table agrees on. A genuine miracle.',
  },
];
