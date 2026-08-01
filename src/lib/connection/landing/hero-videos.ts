export const HERO_PC_VIDEOS = [
  '/Hero_PC/01_Hero_PC_Flower.mp4',
  '/Hero_PC/02_Hero_PC_Hiking.mp4',
  '/Hero_PC/03_Hero_PC_Dinner.mp4',
  '/Hero_PC/04_Hero_PC_Running.mp4',
  '/Hero_PC/05_Hero_PC_SUP.mp4',
] as const;

export const HERO_MOBILE_VIDEOS = [
  '/Hero_Mobile/01_Hero_Mobile_Flower.mp4',
  '/Hero_Mobile/02_Hero_Mobile_Dinner.mp4',
  '/Hero_Mobile/03_Hero_Mobile_Fitness.mp4',
  '/Hero_Mobile/04_Hero_Mobile_Cafe.mp4',
  '/Hero_Mobile/05_Hero_Mobile_Fireworks.mp4',
] as const;

export function pickRandomHeroVideo<T>(videos: readonly T[]): T {
  return videos[Math.floor(Math.random() * videos.length)]!;
}

/** Pick a random video that is not the excluded one (for sequential rotation). */
export function pickRandomHeroVideoExcluding<T>(videos: readonly T[], exclude: T): T | null {
  const pool = videos.filter((v) => v !== exclude);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Pick from pool while skipping session-failed sources; never returns `exclude`. */
export function pickNextHeroVideo(
  videos: readonly string[],
  exclude: string,
  failed: ReadonlySet<string>,
): string | null {
  let pool = videos.filter((v) => v !== exclude && !failed.has(v));
  if (pool.length === 0) {
    pool = videos.filter((v) => v !== exclude);
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
