// Flavour cards. `tone` maps to the .c1-.c4 packaging colour pairings in
// global.css (one consistent system, one distinct colour per flavour, per the
// brand-guide packaging colour system). `shape` is the brand-element outline
// (Brand Elements – Shapes) each tub sits inside.
export interface Flavour {
  tone: 'c1' | 'c2' | 'c3' | 'c4';
  shape: string;
  name: string;
  tagline: string;
  img: string;
  alt: string;
}

export const flavours: Flavour[] = [
  {
    tone: 'c1',
    shape: '/assets/shapes/quatrefoil.svg',
    name: 'Classic Salted',
    tagline: 'the everyday hero',
    img: '/assets/img/tubs/tub-salted.jpg',
    alt: 'Babs salted buttrly spread tub',
  },
  {
    tone: 'c2',
    shape: '/assets/shapes/ribbed-circle.svg',
    name: 'High Protein',
    tagline: 'lower calorie, still butter',
    img: '/assets/img/tubs/tub-protein.jpg',
    alt: 'Babs high protein lower calorie buttrly spread tub',
  },
  {
    tone: 'c3',
    shape: '/assets/shapes/butter-curl.svg',
    name: 'Plant Based',
    tagline: 'dairy-free, still rich',
    img: '/assets/img/tubs/tub-plant.jpg',
    alt: 'Babs plant based buttrly spread tub',
  },
  {
    tone: 'c4',
    shape: '/assets/shapes/flower.svg',
    name: 'Dairy Free',
    tagline: 'cruelty-free and proud',
    img: '/assets/img/tubs/tub-dairyfree.jpg',
    alt: 'Babs dairy free spread tub',
  },
];
