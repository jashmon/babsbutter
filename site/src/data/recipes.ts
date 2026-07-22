// Horizontal-scroll recipe cards ("Cook something happy").
export interface Recipe {
  title: string;
  meta: string;
  img: string;
  alt: string;
}

export const recipes: Recipe[] = [
  {
    title: 'Diner Pancakes',
    meta: '15 min · one pan',
    img: '/assets/img/img-igrejapreta.jpg',
    alt: 'Diner pancakes with butter and syrup',
  },
  {
    title: 'Croissants',
    meta: 'a weekend project',
    img: '/assets/img/croissants.jpg',
    alt: 'Golden all-butter croissants',
  },
  {
    title: 'Shortcrust Tart',
    meta: '90 min · showstopper',
    img: '/assets/img/tart.jpg',
    alt: 'Mascarpone tart with a buttery crust',
  },
  {
    title: 'Perfect Toast',
    meta: '4 min · no excuses',
    img: '/assets/img/spread-knife.jpg',
    alt: 'Thick butter on seeded toast',
  },
];
