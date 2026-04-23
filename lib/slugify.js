export function slugify(input) {
  if (!input) return '';
  return input
    .toString()
    .toLowerCase()
    .trim()
    // Remove accents
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Replace any non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Cap length
    .slice(0, 80);
}