/**
 * A simple implementation of Perlin noise for procedural map generation.
 * This is based on the improved Perlin noise algorithm.
 */

// Permutation table
const generatePermutationTable = (random: () => number): number[] => {
  const p: number[] = [];
  for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(random() * 256);
  }
  return p.concat(p); // Duplicate for easier calculation
};

// Fade function for smoother interpolation
const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

// Linear interpolation
const lerp = (t: number, a: number, b: number): number => a + t * (b - a);

// Gradient function
const grad = (hash: number, x: number, y: number): number => {
  const h = hash & 15;
  const grad = 1 + (h & 7); // Gradient value between 1 and 8
  const gradX = h < 8 ? x : y; // Pick x or y based on hash bit
  const gradY = h < 4 ? y : x; // Pick x or y based on another hash bit

  return ((h & 1) !== 0 ? -gradX : gradX) + ((h & 2) !== 0 ? -gradY : gradY);
};

/**
 * Generate Perlin noise at coordinates (x, y)
 * @param x The x coordinate
 * @param y The y coordinate
 * @param p Permutation table
 * @returns A value between -1 and 1
 */
const noise = (x: number, y: number, p: number[]): number => {
  // Calculate integer grid cell coordinates
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  // Get relative coordinates within the cell
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // Compute fade curves for each coordinate
  const u = fade(xf);
  const v = fade(yf);

  // Hash coordinates of the 4 corners
  const A = p[X] + Y;
  const B = p[X + 1] + Y;
  const AA = p[A];
  const AB = p[A + 1];
  const BA = p[B];
  const BB = p[B + 1];

  // Blend the gradients at each corner
  return lerp(
    v,
    lerp(u, grad(p[AA], xf, yf), grad(p[BA], xf - 1, yf)),
    lerp(u, grad(p[AB], xf, yf - 1), grad(p[BB], xf - 1, yf - 1))
  );
};

/**
 * Generate a 2D Perlin noise value with octaves for more natural-looking results
 * @param x The x coordinate
 * @param y The y coordinate
 * @param random A seedable random function
 * @param octaves Number of detail layers
 * @param persistence How much each octave contributes
 * @param lacunarity How frequency increases with each octave
 * @returns A value normalized between 0 and 1
 */
export const perlinNoise = (
  x: number,
  y: number,
  random: () => number,
  octaves: number = 6,
  persistence: number = 0.5,
  lacunarity: number = 2
): number => {
  const p = generatePermutationTable(random);

  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  // Add successive octaves
  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency, p) * amplitude;

    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  // Return normalized value between 0 and 1
  return (total / maxValue + 1) / 2;
};
