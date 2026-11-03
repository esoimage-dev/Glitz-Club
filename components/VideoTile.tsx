'use client';
import { useRef } from 'react';
import Image from 'next/image';

/** Video slot: shows the poster until a src is provided, then plays muted on hover and when in view. */
export default function VideoTile({ poster, alt, cls, src }: { poster: string; alt: string; cls?: string; src?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  return (
    <figure className={`vt ph ${cls ?? ''}`} onMouseEnter={() => v.current?.play()} onMouseLeave={() => v.current?.pause()}>
      <Image src={poster} alt={alt} fill sizes="(max-width:860px) 50vw, 25vw" />
      {src && <video ref={v} src={src} muted loop playsInline preload="none" poster={poster} />}
    </figure>
  );
}
