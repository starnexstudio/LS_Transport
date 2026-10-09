export type ServiceDetail = {
  slug: string;
  introduction: string;
  scope: { title: string; text: string }[];
  preparation: string[];
  priceFactors: string;
  question: string;
  answer: string;
};
export const serviceDetails: ServiceDetail[] = [
  {
    slug: "clearance",
    introduction:
      "From a single room to a whole flat – we clear what has to go and leave what you want to keep.",
    scope: [
      {
        title: "Living spaces",
        text: "You decide what goes; we agree it clearly before we start.",
      },
      {
        title: "Basements and attics",
        text: "Stairs and long carrying routes are part of the plan.",
      },
      {
        title: "Dismantling and disposal",
        text: "Add them to your request and we handle everything in one go.",
      },
    ],
    preparation: [
      "Location and rooms",
      "Approximate amount or photos",
      "Items that should stay",
      "Floor, lift and parking",
    ],
    priceFactors:
      "Scope, amount, access and any extra work. The price is agreed before we start.",
    question: "Does everything need to be sorted beforehand?",
    answer:
      "Just decide what stays and keep personal documents separate. We'll handle the rest.",
  },
  {
    slug: "disposal",
    introduction:
      "After a clearance or strip-out, we sort everything and dispose of it properly.",
    scope: [
      {
        title: "Sorted by material",
        text: "Furniture, wood, metal and mixed items, each to the right place.",
      },
      {
        title: "Combined with clearance",
        text: "Dismantling, removal and disposal planned as one job.",
      },
      {
        title: "Special materials",
        text: "Mention them in advance so we can confirm before you book.",
      },
    ],
    preparation: [
      "Types of material and amounts",
      "Photos of the items",
      "Any special or unknown substances",
      "Location and access for collection",
    ],
    priceFactors:
      "Material, amount, carrying distance and collection. The price is agreed before we start.",
    question: "Can you take every kind of material?",
    answer:
      "Not automatically. List all materials in your request and we'll confirm what we can take.",
  },
  {
    slug: "dismantling",
    introduction:
      "Before a renovation, the old has to go. We strip out, sort and dispose – from floor to ceiling.",
    scope: [
      {
        title: "Floors, tiles & walls",
        text: "Parquet, laminate, carpet, tiles, wallpaper and panelling.",
      },
      {
        title: "Bathroom, kitchen & doors",
        text: "Bathtubs, sinks, toilets, fittings, kitchens, doors and frames.",
      },
      {
        title: "Built-in units & disposal",
        text: "Non-load-bearing drywall and fitted units, sorted and disposed of.",
      },
    ],
    preparation: [
      "Photos of what should come out",
      "Dimensions and fixings",
      "Pipes or cables in the work area",
      "Parts that should stay",
    ],
    priceFactors:
      "Type, size and fixing of the parts, access and disposal. The price is agreed before we start.",
    question: "Are electrical or plumbing connections included?",
    answer:
      "Not automatically. Mention any connections and we'll clarify specialist work before we start.",
  },
  {
    slug: "furniture-transport",
    introduction:
      "A single piece or a full load – carefully packed, collected and delivered.",
    scope: [
      {
        title: "Collection",
        text: "Tell us what moves, where it stands and any unusual sizes or weights.",
      },
      {
        title: "Delivery",
        text: "Floor, lift and access at the destination are part of the plan.",
      },
      {
        title: "Combined jobs",
        text: "Transport, clearance and cleaning in one booking.",
      },
    ],
    preparation: [
      "Both addresses, including floors",
      "Number and size of the pieces",
      "Access, lifts and parking",
      "Preferred date and alternatives",
    ],
    priceFactors:
      "Distance, number and size of pieces, and access at both ends. The price is agreed before we start.",
    question: "Do you move single pieces of furniture?",
    answer:
      "Yes. Send us the dimensions and both addresses, and we'll confirm the date with you.",
  },
  {
    slug: "cleaning",
    introduction:
      "Once the rooms are empty, we clean – so you can hand over swept clean.",
    scope: [
      {
        title: "Straight after clearance",
        text: "No second appointment needed.",
      },
      {
        title: "Swept-clean handover",
        text: "Floors, surfaces and storage rooms ready for the landlord or buyer.",
      },
      {
        title: "Every type of space",
        text: "Flats, houses, basements, attics and commercial spaces.",
      },
    ],
    preparation: [
      "Approximate size of the rooms",
      "Handover date",
      "Any heavy soiling",
    ],
    priceFactors:
      "Area, condition and date. The price is agreed before we start.",
    question: "Can cleaning be combined with the clearance?",
    answer: "Yes – request both together and we plan them as one job.",
  },
];
