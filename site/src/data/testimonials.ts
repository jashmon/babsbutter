// Four customer quote cards. Avatars use known-good Unsplash photo IDs served
// at 150x150.
export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

const U = 'https://images.unsplash.com/';
const p = (id: string) => `${U}${id}?auto=format&fit=crop&q=80&w=150&h=150`;

export const testimonials: Testimonial[] = [
  {
    text: 'The berry whipped one disappeared in a day. A single day. I have started hiding a tub behind the pickles.',
    image: p('photo-1494790108377-be9c29b29330'),
    name: 'Meera Krishnan',
    role: 'Bengaluru',
  },
  {
    text: 'Our croissants have never laminated better. The unsalted block is an absolute workhorse in our kitchen.',
    image: p('photo-1507003211169-0a1dd7228f2d'),
    name: 'Arjun Mehta',
    role: 'head baker, Fig & Flour',
  },
  {
    text: 'The plant-based churn is the first one my dairy-free kid and I can actually share off the same knife.',
    image: p('photo-1438761681033-6461ffad8d80'),
    name: 'Ines Fernandes',
    role: 'food writer, Goa',
  },
  {
    text: 'Three ingredients on the label and I could read every one out loud. That never happens with butter.',
    image: p('photo-1472099645785-5658abf4ff4e'),
    name: 'Bilal Ahmed',
    role: 'label-reading dad',
  },
];
