"use client";

import { useState } from "react";

/** 로드되면 천천히 나타나는 이미지 (로딩 중엔 부모의 배경색이 보임) */
export default function FadeImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      ref={(el) => {
        if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
      }}
      onLoad={() => setLoaded(true)}
      // 페이드인과 hover 확대가 같은 transition 속성을 덮어쓰지 않도록 한 번에 지정
      style={{ transition: "opacity 700ms ease-out, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      className={`${loaded ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
