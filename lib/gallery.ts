// Photos used across the site. Width and height are the files' real pixel
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

export const photos = {
  bathtubRemoval: {
    src: "/images/bathtub-removal.webp",
    alt: "Worker lifting an old bathtub out during a bathroom strip-out",
    width: 1400,
    height: 926,
    caption: "Removing an old bathtub",
  },
  disposalFurniture: {
    src: "/images/disposal-furniture.webp",
    alt: "Pile of discarded wooden chairs and tables",
    width: 1400,
    height: 1050,
    caption: "Old furniture ready for disposal",
  },
  disposalRecycling: {
    src: "/images/disposal-recycling.webp",
    alt: "Recycling container labelled cardboard only",
    width: 1400,
    height: 934,
    caption: "Sorted by material",
  },
  cleaningFloor: {
    src: "/images/cleaning-floor.webp",
    alt: "Mopping a wooden floor",
    width: 900,
    height: 1350,
    caption: "Floors cleaned",
  },
  wrappedFurniture: {
    src: "/images/wrapped-living-room.jpg",
    alt: "Living room with a sofa and armchairs covered in protective film",
    width: 1125,
    height: 750,
    caption: "Furniture protected for the move",
  },
} satisfies Record<string, Photo>;
