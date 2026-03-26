# 가락보 편집기

3소박 4박 타악 가락보 편집기 — Next.js 14 + TypeScript

## 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

## Vercel 배포 (무료)

1. [github.com](https://github.com) 에서 새 레포 생성
2. 이 폴더를 push:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/유저명/garakbo.git
   git push -u origin main
   ```
3. [vercel.com](https://vercel.com) 접속 → "New Project" → GitHub 레포 선택
4. 설정 건드릴 필요 없이 바로 **Deploy** 클릭
5. 완료! `https://garakbo.vercel.app` 형태로 URL 생성

## 광고 붙이기 (Google AdSense)

### 1. AdSense 승인 받기
- [adsense.google.com](https://adsense.google.com) 가입 후 사이트 등록 및 승인

### 2. app/layout.tsx에 스크립트 추가
```tsx
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
/>
```

### 3. components/AdBanner.tsx 수정
주석 처리된 `<ins>` 태그의 주석을 해제하고
`data-ad-client`, `data-ad-slot` 값을 AdSense에서 받은 값으로 교체

## 구조

```
app/
  layout.tsx      ← 폰트, 메타데이터
  page.tsx        ← 광고 + 앱 레이아웃
  globals.css     ← 전체 스타일
components/
  GarakboApp.tsx  ← 가락보 편집기 전체
  AdBanner.tsx    ← 광고 배너 (여기서 AdSense 설정)
```
