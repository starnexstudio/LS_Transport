// Before/after photo pairs shown as sliders on the home page. Width and height are the files' real pixel
// sizes; layouts use them to keep each photo's proportions without cropping.
export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};
export type Pair = { before: Photo; after: Photo };

export const pairs = {
  clearance: {
    before: {
      src: "/images/clearance-before.webp",
      alt: "Living room crowded with boxes, clothes and household items",
      width: 800,
      height: 1200,
    },
    after: {
      src: "/images/clearance-after.webp",
      alt: "The same room cleared, with an empty wooden floor",
      width: 800,
      height: 1200,
    },
  },
  bedroom: {
    before: {
      src: "/images/bedroom-before.webp",
      alt: "Bedroom with a wooden bed frame, chest of drawers and chair",
      width: 800,
      height: 1066,
    },
    after: {
      src: "/images/bedroom-after.webp",
      alt: "The same bedroom empty after the furniture was removed",
      width: 800,
      height: 1066,
    },
  },
  bathroom: {
    before: {
      src: "/images/bathroom-before.webp",
      alt: "Bathroom with teal wall tiles, a bathtub and a toilet",
      width: 800,
      height: 1067,
    },
    after: {
      src: "/images/bathroom-after.webp",
      alt: "The same bathroom after the tiles, bathtub and toilet were removed",
      width: 800,
      height: 1067,
    },
  },
} satisfies Record<string, Pair>;
