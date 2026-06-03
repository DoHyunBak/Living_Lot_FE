import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

/**
 * Google Maps 컴포넌트 (@vis.gl/react-google-maps)
 *
 * 환경변수에서 API 키를 읽어옵니다.
 *  - Vite (이 프로젝트):  import.meta.env.VITE_GOOGLE_MAPS_API_KEY
 *  - CRA 였다면:          process.env.REACT_APP_GOOGLE_MAPS_API_KEY
 *
 * .env 파일 예시 (프로젝트 루트):
 *  VITE_GOOGLE_MAPS_API_KEY=AIza...your_key...
 */

// 서울 시청 기준 좌표
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ZOOM = 13

export default function GoogleMapView() {
  // Vite 환경변수 (빌드 시 정적으로 주입됨)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  // 키가 없으면 지도 대신 안내 메시지 (앱 크래시 방지)
  if (!apiKey) {
    return (
      <div style={{ padding: 16, color: '#b91c1c', fontWeight: 600 }}>
        ⚠️ VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다. 프로젝트 루트의 .env 파일을 확인하세요.
      </div>
    )
  }

  return (
    // APIProvider: 최상위에서 API 키를 주입하고 지도 라이브러리를 로드
    <APIProvider apiKey={apiKey}>
      {/* Map 은 부모 컨테이너 크기를 따라가므로, 명시적 크기를 가진 div 로 감싼다 */}
      <div style={{ width: '100%', height: '500px' }}>
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId="DEMO_MAP_ID" // AdvancedMarker 사용을 위해 필요
          gestureHandling="greedy" // 한 손가락/휠로 바로 조작
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 중심 좌표에 마커 표시 (mapId 사용 시 AdvancedMarker 권장) */}
          <AdvancedMarker position={DEFAULT_CENTER} title="서울">
            <Pin background="#0e4a84" borderColor="#093461" glyphColor="#ffffff" />
          </AdvancedMarker>
        </Map>
      </div>
    </APIProvider>
  )
}
