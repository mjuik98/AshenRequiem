/**
 * vite.config.js
 *
 * 설치:
 *   npm install -D vite
 *
 * 실행:
 *   npm run dev      → http://localhost:5173  (HMR 포함)
 *   npm run build    → dist/ 에 번들 생성
 *   npm run preview  → 번들 결과 로컬 미리보기
 *
 * 설계 의도:
 *   - 현재 bare ES module 방식은 파일이 많아질수록 네트워크 요청이 폭증함
 *   - Vite는 dev 서버에서는 native ESM을 그대로 사용하고 (빠른 콜드 스타트)
 *     build 시에만 Rollup으로 번들링하므로 개발 경험과 배포 성능을 동시에 확보
 *   - HMR: JS 수정 시 전체 새로고침 없이 변경된 모듈만 교체
 */

import { defineConfig } from 'vite';
import { resolve }      from 'path';

export default defineConfig({
  // 프로젝트 루트 (index.html 위치)
  root: '.',

  // 정적 에셋 경로 (이미지, 오디오 등)
  publicDir: 'public',

  // 개발 서버 설정
  server: {
    port: 5173,
    open: true,     // 브라우저 자동 오픈
    strictPort: false,
  },

  // 빌드 설정
  build: {
    outDir:    'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },

    // 청크 크기 경고 임계값 (게임 특성상 단일 번들 허용)
    chunkSizeWarningLimit: 800,

    // 소스맵 (배포 디버깅용 — 필요 없으면 false로)
    sourcemap: false,

    // 에셋 인라인 임계값 (4KB 이하 이미지는 base64 인라인)
    assetsInlineLimit: 4096,
  },

  // 경로 alias — 긴 상대경로 ('../../../utils/xxx') 대신 '@/utils/xxx' 사용 가능
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // 테스트/스크립트는 번들 대상에서 제외
  optimizeDeps: {
    exclude: ['scripts', 'tests'],
  },
});
