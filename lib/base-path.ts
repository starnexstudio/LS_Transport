// Set at build time for hosts that serve the site from a subpath (e.g. GitHub Pages).
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  return `${basePath}${path}`;
}
