// "The group chat says" — three auto-scrolling columns of avatar quote cards.
// Adapted from a testimonial-v2 React concept into the Babs zero-JS + vanilla-CSS
// world. Avatars use known-good Unsplash photo IDs served at 150x150.
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
  {
    text: 'It browns like a dream and never splits. My beurre blanc has quietly become the best on the menu.',
    image: p('photo-1534528741775-53994a69daeb'),
    name: 'Zainab Hussain',
    role: 'sous chef, Copper Pot',
  },
  {
    text: 'Slow-churned really does taste different. There is a gentle tang and it lingers on warm toast forever.',
    image: p('photo-1517841905240-472988babdf9'),
    name: 'Aliza Khan',
    role: 'breakfast enthusiast',
  },
  {
    text: 'Turns up churn-fresh in an insulated box, cold to the touch. The delivery honestly feels like a treat.',
    image: p('photo-1500648767791-00dcc994a43e'),
    name: 'Farhan Siddiqui',
    role: 'Mumbai',
  },
  {
    text: 'I switched the whole bakery over. Customers noticed the crumb before I even told them we had changed.',
    image: p('photo-1544005313-94ddf0286df2'),
    name: 'Sana Sheikh',
    role: 'owner, Rise & Crumb',
  },
  {
    text: 'Salted on sourdough is a full personality now. My flatmates and I ration it like it is contraband.',
    image: p('photo-1506794778202-cad84cf45f1d'),
    name: 'Hassan Ali',
    role: 'Hyderabad',
  },
];
