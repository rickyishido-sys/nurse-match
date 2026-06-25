'use client';

import Image from 'next/image';
import { useState } from 'react';

type CoverImageProps = {
  src: string;
  alt: string;
  fallbackClassName: string;
  imageClassName?: string;
  priority?: boolean;
};

/** ローカル画像未配置時はグラデーションへフォールバック */
export function CoverImage({ src, alt, fallbackClassName, imageClassName = 'object-cover', priority }: CoverImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <div className={`absolute inset-0 ${fallbackClassName}`} aria-hidden />
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes='420px'
          className={`${imageClassName} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </>
  );
}
