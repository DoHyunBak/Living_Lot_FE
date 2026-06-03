import type { Report } from '../types'
import { REPORT_META } from '../types'
import { byHour, byWeekday, computeZoneStats } from './analytics'

/** 규칙 기반 가짜 챗봇 — 키워드 + 실제 데이터로 그럴듯한 답변 생성 */
export function chatbotReply(message: string, reports: Report[]): string {
  const m = message.toLowerCase().replace(/\s/g, '')
  const stats = computeZoneStats(reports)
  const top = stats[0]
  const hour = byHour(reports)
  const peakHour = hour.reduce((a, b) => (b.count > a.count ? b : a), hour[0])
  const weekday = byWeekday(reports)
  const peakDay = weekday.reduce((a, b) => (b.count > a.count ? b : a), weekday[0])
  const shortageRatio = Math.round(
    (reports.filter((r) => r.type === 'shortage').length / Math.max(1, reports.length)) * 100,
  )

  if (/(안녕|하이|hello|hi|도움|뭐해|기능)/.test(m)) {
    return '안녕하세요! 저는 Living_Lot 주차 도우미예요 🅿️ "지금 어디가 붐벼?", "어디에 주차하면 좋아?", "확장 1순위는?", "몇 시가 한가해?" 같이 물어보세요.'
  }
  if (/(붐|혼잡|많|핫스팟|문제)/.test(m)) {
    return `지금 신고가 가장 많은 곳은 ⚠️ ${top?.name} (누적 ${top?.total}건)이에요. ${peakDay?.day}요일 ${peakHour?.hour}시 전후에 가장 붐빕니다.`
  }
  if (/(추천|어디.*주차|자리|빈자리|한가|여유)/.test(m)) {
    const calm = [...stats].reverse().find((s) => s.capacity >= 80) ?? stats[stats.length - 1]
    return `여유로운 편인 🅿️ ${calm?.name}(주차면 ${calm?.capacity}면)을 추천해요. 반대로 ${top?.name}은(는) 혼잡하니 피하시는 게 좋아요.`
  }
  if (/(확장|순위|늘려|신설|예산)/.test(m)) {
    const t3 = stats.slice(0, 3).map((s, i) => `${i + 1}. ${s.name}(${s.score}점)`).join(' · ')
    return `데이터 기반 확장 우선순위 TOP3는 ${t3} 이에요. 점수 = (수요 × √지속일수) ÷ 현재 주차면 으로 계산됩니다.`
  }
  if (/(시간|언제|몇시|피크)/.test(m)) {
    return `신고는 ${peakHour?.hour}시에 가장 몰려요. 출근 시간대(8~10시)와 점심(13시) 전후가 피크입니다. 한가한 시간을 노리면 자리 찾기가 수월해요.`
  }
  if (/(불법|부족|유형|통계|비율)/.test(m)) {
    return `전체 신고 중 '공간부족'이 약 ${shortageRatio}%로 가장 많아요. 그다음이 불법주차, 유휴공간 제안 순입니다. 자세한 그래프는 통계 대시보드에서 볼 수 있어요.`
  }
  if (/(신고|어떻게|방법)/.test(m)) {
    return `지도에서 구역을 누르거나 홈의 "현재 위치에서 신고하기"를 누르면 돼요. 사진을 올리면 AI가 유형을 자동으로 판독해 드립니다 📷`
  }
  if (/(고마|감사|thanks|굿|좋아)/.test(m)) {
    return '도움이 되었다니 기뻐요! 여러분의 신고가 캠퍼스를 바꿉니다 🌱'
  }
  return `음… 정확히 이해하지 못했어요 😅 대신 알려드리면, 현재 ${top?.name}이(가) 가장 혼잡하고 ${peakHour?.hour}시가 피크예요. "추천", "확장 순위", "몇 시가 한가해?" 처럼 물어봐 주세요.`
}

export const CHAT_SUGGESTIONS = ['지금 어디가 붐벼?', '어디에 주차하면 좋아?', '확장 1순위는?', '몇 시가 한가해?']
