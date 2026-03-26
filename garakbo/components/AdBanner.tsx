'use client'

interface AdBannerProps {
  position: 'top' | 'bottom'
  // Google AdSense 사용 시 adSlot, adClient 등 props 추가
}

export default function AdBanner({ position }: AdBannerProps) {
  return (
    <div className={`ad-banner ${position}`}>
      {/* 
        Google AdSense 적용 방법:
        1. app/layout.tsx의 <head>에 AdSense 스크립트 추가
           <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous" />
        
        2. 아래 주석 해제 후 data-ad-client, data-ad-slot 값 입력:
        
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '60px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="horizontal"
        />
      */}
      <span>광고 영역 ({position})</span>
    </div>
  )
}
