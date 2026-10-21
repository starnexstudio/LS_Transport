// The Poly Haven assets the scene uses (all CC0), shared by fetch-assets.mjs and
// build-web-assets.mjs.
export const models = [
  // Furniture and household contents that get cleared
  "Sofa_01", "modern_arm_chair_01", "mid_century_lounge_chair", "modern_coffee_table_01", "modern_wooden_cabinet",
  "Television_01", "potted_plant_02", "wooden_table_02", "vintage_suitcase", "wooden_bookshelf_worn",
  "steel_frame_shelves_01", "Ottoman_01", "side_table_tall_01", "GothicCommode_01",
  "painted_wooden_chair_01", "throw_pillows_01", "wicker_basket_02",
  "ceramic_vase_02", "ceramic_vase_03", "ceramic_vase_04", "antique_ceramic_vase_01", "wooden_bowl_01",
  "alarm_clock_01", "standing_picture_frame_01", "standing_picture_frame_02", "hanging_picture_frame_01", "hanging_picture_frame_02",
];
// Small props: their textures never need more than 256 px.
export const smallModels = new Set([
  "ceramic_vase_02", "ceramic_vase_03", "ceramic_vase_04", "antique_ceramic_vase_01", "wooden_bowl_01",
  "alarm_clock_01", "standing_picture_frame_01", "standing_picture_frame_02", "wicker_basket_02",
]);
// Room walls, floor and their section (masonry, concrete); the truck's cargo floor and tail lift.
export const textures = ["beige_wall_002", "herringbone_parquet", "painted_plaster_wall", "concrete_floor_02", "metal_plate", "ash_veneer"];
// Sets used in grey (the concrete of the floor slab).
export const grayTextures = new Set(["concrete_floor_02"]);
export const hdri = "kloofendal_48d_partly_cloudy_puresky";
