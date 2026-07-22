// Flavour cards. `tone` maps to the .c1/.c2/.c3 packaging colour pairings in
// global.css (one consistent system, one distinct colour per flavour).
export interface Flavour {
  tone: 'c1' | 'c2' | 'c3';
  name: string;
  tagline: string;
  img: string;
  alt: string;
}

export const flavours: Flavour[] = [
  {
    tone: 'c1',
    name: 'Classic Salted',
    tagline: 'the everyday hero',
    img: '/assets/img/butter-cube-dark.jpg',
    alt: 'Classic salted cultured butter',
  },
  {
    tone: 'c2',
    name: 'Plant-Based',
    tagline: 'dairy-free, still rich',
    img: '/assets/img/blueberry-croissant.jpg',
    alt: 'Plant-based butter on croissant toast with blueberries',
  },
  {
    tone: 'c3',
    name: 'Berry Whipped',
    tagline: 'the weekend treat',
    img: '/assets/img/img-weitz.jpg',
    alt: 'Whipped berry butter on cream-filled croissants',
  },
];
