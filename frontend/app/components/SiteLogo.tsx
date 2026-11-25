import Image from "next/image";
import { imageSrc } from "@/lib/api/admin";

const DEFAULT_LOGO = { src: "/logo.png", width: 1606, height: 414 };
const ALT = "ARTY INTERIOR";

/**
 * 관리자에서 업로드한 로고가 있으면 그것을, 없으면 기본 로고를 보여준다.
 * 기본·업로드 로고 모두 여백 없이 자른 가로형 이미지를 가정한다.
 */
export default function SiteLogo({
  logoUrl,
  defaultClassName,
  uploadedClassName,
  priority = false,
}: {
  logoUrl: string | null | undefined;
  defaultClassName: string;
  uploadedClassName: string;
  priority?: boolean;
}) {
  const uploaded = imageSrc(logoUrl ?? null);
  if (uploaded) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={uploaded} alt={ALT} className={`${uploadedClassName} w-auto max-w-full object-contain`} />
    );
  }
  return (
    <Image
      src={DEFAULT_LOGO.src}
      alt={ALT}
      width={DEFAULT_LOGO.width}
      height={DEFAULT_LOGO.height}
      priority={priority}
      className={defaultClassName}
    />
  );
}
