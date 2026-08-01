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
