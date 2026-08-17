import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 운영 배포 시 self-contained .next/standalone 디렉터리 생성
  // EC2에 standalone 폴더만 올리면 node server.js로 실행 가능
  output: "standalone",
};

export default nextConfig;
