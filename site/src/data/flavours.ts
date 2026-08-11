// Flavour cards. `tone` maps to the .c1-.c5 packaging colour pairings in
// global.css (one consistent system, one distinct colour per flavour, per the
// brand-guide packaging colour system). `shape` is the brand-element outline
// (Brand Elements – Shapes) each tub sits inside.
export interface Flavour {
  tone: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
  shape: string;
  name: string;
  tagline: string;
  img: string;
  alt: string;
  // Shop-page fields. `weight`/`price` render on the product cards; both are
  // sample figures for client review, same as the awards/stats elsewhere.
  weight?: string;
  price?: string;
}

export const flavours: Flavour[] = [
  {
    tone: 'c1',
    shape: '/assets/shapes/ribbed-circle.svg',
    name: 'Classic Salted',
    tagline: 'the classic',
    img: '/assets/img/tubs/lid-design-01.svg',
    alt: 'Babs classic salted butter lid design',
    weight: '200g tub',
    price: '₹280',
  },
  {
    tone: 'c2',
    shape: '/assets/shapes/ribbed-circle.svg',
    name: 'A2 Butter',
    tagline: 'gut-loving makkhan',
    img: '/assets/img/tubs/lid-design-02.svg',
    alt: 'Babs A2 butter lid design',
    weight: '200g tub',
    price: '₹340',
  },
  {
    tone: 'c3',
    shape: '/assets/shapes/ribbed-circle.svg',
    name: 'Plant Based',
    tagline: 'dairy-free',
    img: '/assets/img/tubs/lid-design-03.svg',
    alt: 'Babs flavour lid design 03',
    weight: '200g tub',
    price: '₹320',
  },
  {
    tone: 'c4',
    shape: '/assets/shapes/ribbed-circle.svg',
    name: 'High Protein',
    tagline: 'fuel with no compromise',
    img: '/assets/img/tubs/lid-design-04.svg',
    alt: 'Babs high protein butter lid design',
    weight: '200g tub',
    price: '₹340',
  },
  {
    tone: 'c5',
    shape: '/assets/shapes/ribbed-circle.svg',
    name: 'Unsalted Butter',
    tagline: 'for the chefs',
    img: '/assets/img/tubs/lid-design-05.svg',
    alt: 'Babs unsalted butter lid design',
    weight: '200g tub',
    price: '₹280',
  },
];
