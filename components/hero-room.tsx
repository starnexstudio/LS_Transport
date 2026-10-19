import type { CSSProperties } from "react";
import Image from "next/image";
import { asset } from "@/lib/base-path";

const dir = "/images/hero-room";

// Geometry and timing come from the Figma desktop frame: the room artwork is
// 872 × 678 units and every value below is in those units, so the scene scales
// as one piece. Times are seconds from the start of the clearing sequence.
type Piece = {
  name: string;
  image: { src: string; width: number; height: number };
  /** x, y, width, height of the cutout inside the room. */
  box: [number, number, number, number];
  /** Contact-shadow ellipse, relative to the cutout. */
  contact: [number, number, number, number];
  /** Where the piece ends up, past the open right side of the room. */
  exit: [number, number];
  /** How far the cutout rises off the floor before it moves out. */
  lift: number;
  /** Rotation in radians: peak while lifting, then while carried out. */
  tilt: [number, number];
  /** Lift starts, lift ends, shadow at half, shadow gone, move starts, move ends. */
  times: [number, number, number, number, number, number];
  /** Larger furniture accelerates more slowly. */
  heavy?: boolean;
  /** The wardrobe steps forward off the wall first: offset and arrival time. */
  step?: [number, number, number];
};

const box = { src: `${dir}/box-large.webp`, width: 202, height: 200 };

// Back to front, as layered in Figma.
const pieces: Piece[] = [
  {
    name: "plant",
    image: { src: `${dir}/plant.webp`, width: 238, height: 380 },
    box: [738.61, 299.37, 119.115, 190],
    contact: [-3.57, 175.23, 109.586, 23.823],
    exit: [201.387, 46.746],
    lift: -8,
    tilt: [0.044, 0.017],
    times: [3.55, 3.77, 3.89, 4.09, 3.65, 4.45],
  },
  {
    name: "wardrobe",
    image: { src: `${dir}/wardrobe.webp`, width: 294, height: 520 },
    box: [374.02, 143.96, 148.131, 262],
    contact: [-4.44, 243.63, 136.28, 29.626],
    exit: [565.98, 224.524],
    lift: -5,
    tilt: [0.014, 0.006],
    times: [2.95, 3.25, 3.77, 4.02, 3.05, 4.47],
    heavy: true,
    step: [-146.034, 47.614, 3.47],
  },
  {
    name: "sofa",
    image: { src: `${dir}/sofa.webp`, width: 520, height: 311 },
    box: [476.74, 334.33, 250.804, 150],
    contact: [0, 132.4, 220.707, 22],
    exit: [463.26, 111.306],
    lift: -6,
    tilt: [0.017, 0.007],
    times: [2.35, 2.65, 2.735, 2.973, 2.45, 3.4],
    heavy: true,
  },
  {
    name: "side-table",
    image: { src: `${dir}/side-table.webp`, width: 160, height: 190 },
    box: [668.87, 419.63, 80.019, 95],
    contact: [-2.4, 85.08, 73.618, 16.004],
    exit: [271.128, 65.382],
    lift: -8,
    tilt: [0.035, 0.014],
    times: [1.9, 2.12, 2.228, 2.418, 2, 2.76],
  },
  {
    name: "chair",
    image: { src: `${dir}/chair.webp`, width: 178, height: 290 },
    box: [411.27, 362.75, 88.952, 145],
    contact: [-2.67, 133.97, 81.836, 17.79],
    exit: [528.726, 132.913],
    lift: -8,
    tilt: [0.035, 0.014],
    times: [1.45, 1.67, 1.784, 1.979, 1.55, 2.33],
  },
  {
    name: "box-stack",
    image: { src: `${dir}/box-stack.webp`, width: 216, height: 260 },
    box: [242.45, 373.78, 108.25, 130],
    contact: [-3.25, 116.58, 99.59, 21.65],
    exit: [697.551, 179.877],
    lift: -9,
    tilt: [0.026, 0.01],
    times: [0.85, 1.05, 1.166, 1.346, 0.95, 1.67],
  },
  {
    name: "box3",
    image: box,
    box: [105.3, 412.47, 100.775, 100],
    contact: [-3.02, 87.5, 92.713, 20.155],
    exit: [834.705, 221.718],
    lift: -10,
    tilt: [0.035, 0.014],
    times: [1.15, 1.35, 1.475, 1.662, 1.25, 2],
  },
  {
    name: "box1",
    image: box,
    box: [335.53, 496.15, 74.574, 74],
    contact: [-2.24, 64.75, 68.608, 14.915],
    exit: [604.475, 160.563],
    lift: -10,
    tilt: [0.035, 0.014],
    times: [0.55, 0.73, 0.86, 1.035, 0.65, 1.35],
  },
];

function pieceStyle(piece: Piece) {
  const [x, y, w, h] = piece.box;
  const [cx, cy, cw, ch] = piece.contact;
  const [t0, t1, t2, t3, t4, t5] = piece.times;
  const style: Record<string, string | number> = {
    "--x": x,
    "--y": y,
    "--w": w,
    "--h": h,
    "--cx": cx,
    "--cy": cy,
    "--cw": cw,
    "--ch": ch,
    "--dx": piece.exit[0],
    "--dy": piece.exit[1],
    "--lift": piece.lift,
    "--tilt": `${piece.tilt[0]}rad`,
    "--tilt-rest": `${piece.tilt[1]}rad`,
    "--t0": `${t0}s`,
    "--t1": `${t1}s`,
    "--t2": `${t2}s`,
    "--t3": `${t3}s`,
    "--t4": `${t4}s`,
    "--t5": `${t5}s`,
  };
  if (piece.heavy) style["--ease"] = "cubic-bezier(0.6, 0, 0.35, 1)";
  if (piece.step) {
    style["--sx"] = piece.step[0];
    style["--sy"] = piece.step[1];
    style["--ts"] = `${piece.step[2]}s`;
  }
  return style as CSSProperties;
}

// The cutaway room. Every piece carries its Figma track as custom properties;
// HeroStage scrubs the resulting animations with the scroll position. Pieces
// fade out as they pass the room's open right side.
export function HeroRoom() {
  return (
    <div className="hero-scene">
      <div className="hero-stage">
        <div
          className="hero-room"
          role="img"
          aria-label="Ein möblierter Raum wird Stück für Stück geräumt, bis er leer ist."
        >
          <img
            className="hero-room-shadow"
            src={asset(`${dir}/ground-shadow.svg`)}
            alt=""
            width={810}
            height={141}
          />
          <Image
            className="hero-room-empty"
            src={asset(`${dir}/room-empty.webp`)}
            alt=""
            width={872}
            height={678}
            loading="eager"
            fetchPriority="high"
          />
          <div className="hero-pieces">
            {pieces.map((piece) => (
              <div
                key={piece.name}
                className="hero-piece"
                data-step={piece.step ? "" : undefined}
                style={pieceStyle(piece)}
              >
                <img
                  className="hero-piece-shadow"
                  src={asset(`${dir}/shadow-${piece.name}.svg`)}
                  alt=""
                />
                <Image
                  className="hero-piece-image"
                  src={asset(piece.image.src)}
                  alt=""
                  width={piece.image.width}
                  height={piece.image.height}
                  loading="eager"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
