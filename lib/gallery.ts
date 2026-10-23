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
      alt: "Wohnzimmer voller Kartons, Kleidung und Hausrat",
      width: 800,
      height: 1200,
    },
    after: {
      src: "/images/clearance-after.webp",
      alt: "Derselbe Raum geräumt, mit leerem Holzboden",
      width: 800,
      height: 1200,
    },
  },
  bathroom: {
    before: {
      src: "/images/bathroom-before.webp",
      alt: "Badezimmer mit petrolfarbenen Wandfliesen, Badewanne und WC",
      width: 800,
      height: 1067,
    },
    after: {
      src: "/images/bathroom-after.webp",
      alt: "Dasselbe Badezimmer nach dem Entfernen von Fliesen, Badewanne und WC",
      width: 800,
      height: 1067,
    },
  },
} satisfies Record<string, Pair>;
