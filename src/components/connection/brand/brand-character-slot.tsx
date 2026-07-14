'use client';

import { ScatterCharacters } from '@/components/connection/brand/brand-editorial';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { BRAND_CHARACTERS_ENABLED } from '@/lib/connection/brand/brand-config';
import type { BrandCharacterId } from '@/lib/connection/brand/characters';

type CharacterProps = {
  id: BrandCharacterId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'contained' | 'peek' | 'float';
  imageSrc?: string;
  className?: string;
  label?: boolean;
};

type SlotProps = CharacterProps & {
  /** absolute 配置などラッパー用（キャラクター無効時は描画しない） */
  wrapperClassName?: string;
};

/**
 * キャラクター配置スロット — BRAND_CHARACTERS_ENABLED が false の間は何も描画しない。
 * 再有効化: src/lib/connection/brand/brand-config.ts
 */
export function BrandCharacterSlot({ wrapperClassName, ...props }: SlotProps) {
  if (!BRAND_CHARACTERS_ENABLED) return null;

  const node = <BrandCharacter {...props} />;

  if (!wrapperClassName) return node;

  return <div className={`pointer-events-none ${wrapperClassName}`}>{node}</div>;
}

type ScatterProps = {
  ids: BrandCharacterId[];
  className?: string;
};

/** 複数キャラクターを散らすスロット（再有効化時に ScatterCharacters を表示） */
export function BrandCharacterScatter({ ids, className = '' }: ScatterProps) {
  if (!BRAND_CHARACTERS_ENABLED) return null;
  return <ScatterCharacters ids={ids} className={className} />;
}
