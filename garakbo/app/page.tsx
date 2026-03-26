import AdBanner from '@/components/AdBanner'
import GarakboApp from '@/components/GarakboApp'

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* 상단 광고 */}
      <AdBanner position="top" />

      {/* 가락보 앱 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <GarakboApp />
      </div>

      {/* 하단 광고 */}
      <AdBanner position="bottom" />
    </div>
  )
}
