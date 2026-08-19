import { notFound } from "next/navigation";
import type { Metadata } from "next";
import regions from "@/data/regions.json";
import services from "@/data/services.json";
import { siteConfig } from "@/data/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegionDirectory from "@/components/RegionDirectory";
import PhotoSlot from "@/components/PhotoSlot";
import { pickPhotos } from "@/data/photos";
import { cyclePick, pickDistinctCombo } from "@/lib/rotate";
import { getNearbyRegions } from "@/lib/regionClusters";

type RegionKey = keyof typeof regions;
type ServiceKey = keyof typeof services;

export function generateStaticParams() {
  const params: { service: string; region: string }[] = [];
  for (const service of Object.keys(services)) {
    for (const region of Object.keys(regions)) {
      params.push({ service, region });
    }
  }
  return params;
}


function pickSymptomPhrase(region: string, phrases: string[]) {
  const keys = Object.keys(regions);
  const idx = keys.indexOf(region);
  return phrases[cyclePick(phrases.length, idx >= 0 ? idx : 0)];
}

// 지역마다 다른 조합이 나오도록, 각 콘텐츠 블록마다 다른 salt로 로테이션
// (단순 % 연산은 풀 크기만큼 주기가 생겨 그 주기마다 완전히 동일한 조합이 반복되므로,
//  cyclePick으로 사이클마다 곱수를 바꿔 그 반복을 깬다)
function pickVariant<T>(pool: T[] | undefined, fallback: T, regionIndex: number, salt: number, slugSalt = 0): T {
  if (!pool || pool.length === 0) return fallback;
  const idx = cyclePick(pool.length, regionIndex, salt, slugSalt);
  return pool[idx];
}

function rotateFaqs(pool: { q: string; a: string }[], regionIndex: number, salt = 0, slugSalt = 0) {
  if (pool.length === 0) return [];
  return pickDistinctCombo(pool, regionIndex + slugSalt * 28, 4, salt);
}

// 지역별 배관 환경 특성 매핑
const regionTraits: Record<string, [string, string]> = {
  gangnam:     ['고층 주상복합·오피스빌딩·강남역 상권 밀집 지역', '고압 수압 변화와 기름 슬러지 누적'],
  gangdong:    ['고덕·강일 신축 대단지와 암사동 구축 혼재 지역', '신축 잔재물과 노후 배관 스케일 혼재'],
  gangbuk:     ['30~40년 된 다세대·빌라 밀집 지역', '노후 주철관 스케일 누적과 이음매 이완'],
  gangseo:     ['마곡 신도시 IT기업·가양·화곡 구축 혼재 지역', '신구 배관 혼재로 수압 불균형 잦음'],
  gwanak:      ['고시원·원룸·대학가 단기 거주 밀집 지역', '음식물 잦은 투입과 물티슈 이물질 누적'],
  gwangjin:    ['광장동 아파트 단지·건대 상권 밀집 지역', '공용 횡주관 기름 슬러지 집중 누적'],
  guro:        ['가리봉·구로 공단 상가·다세대 혼재 지역', '영업장 기름과 노후 배관 복합 막힘'],
  geumcheon:   ['가산디지털단지 오피스·시흥·독산 주거 혼재 지역', '상가 기름 슬러지와 주거 이물질 복합 누적'],
  nowon:       ['상계·중계 대단지 아파트 밀집 지역', '공용 스택관 슬러지 누적과 횡주관 역류'],
  dobong:      ['방학·쌍문 30년 이상 구축 단독·빌라 밀집 지역', '노후 주철관 부식과 이음매 이완'],
  dongdaemun:  ['답십리·이문 재개발 구역과 구축 혼재 지역', '공사 진동으로 배관 연결부 느슨해짐 잦음'],
  dongjak:     ['노량진 고시촌·대방·사당 주거 혼재 지역', '고시원 공용 배관 기름 슬러지 집중 누적'],
  mapo:        ['공덕역 환승역세권·망원·합정 상권 밀집 지역', '상가 기름과 오피스텔 공용 배관 복합 막힘'],
  seodaemun:   ['신촌·홍대 인근 원룸·상가·주거 혼재 지역', '음식점 기름과 원룸 이물질 복합 누적'],
  seocho:      ['서초·반포 고급 아파트·강남 업무지구 인근 지역', '고층 수압 변화와 배관 스케일 누적'],
  seongdong:   ['성수 IT·카페 상권과 금호·행당 주거 혼재 지역', '업소 기름 슬러지와 구축 노후 배관 혼재'],
  seongbuk:    ['길음·돈암 구축 다세대와 성북 주거 혼재 지역', '30년 이상 노후 배관 스케일 집중 누적'],
  songpa:      ['잠실·가락시장·문정 신구 아파트 혼재 지역', '대단지 공용관 슬러지와 상가 기름 누적'],
  yangcheon:   ['목동 신시가지 아파트·신정동 구축 혼재 지역', '30년 된 목동 배관 스케일 누적 잦음'],
  yeongdeungpo:['여의도 오피스·영등포 상권·신길 주거 혼재 지역', '업소 기름과 오피스 공용 배관 복합 막힘'],
  yongsan:     ['이태원 상권·한강로 오피스텔·해방촌 구축 혼재 지역', '상가 기름과 급경사 지형 배관 이물질 침전'],
  eunpyeong:   ['응암·불광·수색 30년 이상 구축 빌라 밀집 지역', '노후 배관 이음매 이완과 스케일 복합 누적'],
  jongno:      ['경복궁 인근 한옥마을·업무지구·관광지 혼재 지역', '노후 배관과 관광지 대용량 오수 복합 막힘'],
  jung:        ['중구 을지로 오피스·명동 상권·황학동 혼재 지역', '상업지구 대용량 기름과 노후 배관 복합 막힘'],
  junggu:      ['광희동·다산동 구도심 주거·상권 혼재 지역', '노후 상권 기름과 구축 배관 스케일 누적'],
  jungnang:    ['중화·면목 30년 이상 다세대·빌라 밀집 지역', '노후 배관 스케일과 이물질 복합 누적'],
  ilsan:       ['일산 신도시 30년 노후화 아파트 밀집 지역', '일산 노후화된 신도시 배관 스케일 집중'],
  gunpo:       ['산본 신도시·광정동 구도심 혼재 지역', '신도시 노후화 배관 스케일과 구도심 이물질 누적'],
  anseong:     ['공도읍 신도시·금광면 농촌 주거 혼재 지역', '정화조 연결 노후 배관과 농촌 이물질 유입'],
  yangju:      ['백석읍 신축과 양주 구도심 혼재 지역', '신구 배관 혼재 수압 불균형과 노후 스케일 누적'],
  incheon:     ['남동·부평 산업단지와 주거지 혼재 지역', '공장 기름과 구도심 노후 배관 복합 막힘'],
  incheon_bupyeong: ['부평 산업단지·구도심 다세대 혼재 지역', '공장 기름과 노후 배관 스케일 복합 막힘'],
  incheon_namdong:  ['남동공단·논현 신축 아파트 혼재 지역', '산업체 기름과 신축 잔재물 복합 누적'],
  incheon_seo:      ['검단 신도시·루원시티 신축 대단지 지역', '신축 배관 잔재물과 시공 후 초기 막힘'],
  incheon_yeonsu:   ['송도 국제도시·연수 신구 아파트 혼재 지역', '신도시 공용 배관 초기 막힘과 슬러지 누적'],
  incheon_gyeyang:  ['계양 구도심·작전동 아파트 밀집 지역', '노후 아파트 스케일과 공용 횡주관 막힘'],
  suwon:       ['영통·권선·장안 신구 대단지 혼재 지역', '대단지 공용 스택관 슬러지와 역류 잦음'],
  seongnam:    ['분당 신도시·수정·중원 구도심 혼재 지역', '분당 30년 배관 스케일과 구도심 노후 배관 혼재'],
  goyang:      ['일산 신도시·화정·능곡 구축 혼재 지역', '일산 노후화된 신도시 배관 스케일 집중'],
  yongin:      ['수지·기흥 신축 대단지·처인 단독 혼재 지역', '신축 잔재물과 처인구 정화조 연결 막힘'],
  anyang:      ['범계·평촌 신도시·만안 구도심 혼재 지역', '평촌 30년 배관 스케일과 만안 노후 배관 혼재'],
  bucheon:     ['중동 신도시·원미·소사 구도심 혼재 지역', '중동 신도시 노후화 배관과 구시가지 복합 막힘'],
  ansan:       ['단원 공단·상록 주거·반월 혼재 지역', '공장 기름 슬러지와 주거 이물질 복합 누적'],
  gwangmyeong: ['철산·하안 대단지 아파트·소하 주거 밀집 지역', '30년 대단지 공용관 스케일과 슬러지 누적'],
  hanam:       ['미사 강변 신도시·풍산 구도심 혼재 지역', '미사 신도시 초기 잔재물과 구도심 노후 배관'],
  gimpo:       ['한강신도시·마산 구도심·양촌 혼재 지역', '신도시 시공 잔재물과 구도심 노후 배관 혼재'],
  uijeongbu:   ['민락·낙양 신축과 의정부 구도심 혼재 지역', '신구 배관 혼재로 수압 불균형과 스케일 누적'],
  namyangju:   ['다산·별내 신도시·화도 구도심 혼재 지역', '다산 신도시 초기 잔재물과 구도심 정화조 막힘'],
  hwaseong:    ['동탄 신도시·봉담·우정 구도심 혼재 지역', '동탄 신축 잔재물과 구도심 노후 배관 스케일'],
  pyeongtaek:  ['고덕 국제도시·브레인시티 신도시 개발 지역', '신도시 시공 잔재물과 기존 단독주택 정화조 막힘'],
  paju:        ['운정 신도시·금촌 구도심 혼재 지역', '운정 신도시 배관 잔재물과 금촌 노후 배관 혼재'],
  siheung:     ['배곧 신도시·시화 공단·정왕 주거 혼재 지역', '공단 기름과 신도시 잔재물 복합 막힘'],
  osan:        ['세교 신도시·오산 구도심 주거 혼재 지역', '신도시 초기 잔재물과 구도심 스케일 누적'],
  gwacheon:    ['과천 정부청사 인근·구도심 아파트 밀집 지역', '30년 이상 아파트 배관 스케일 집중 누적'],
  gapyeong:    ['청평·설악 전원주택·단독 주거 밀집 지역', '정화조 연결 노후 배관과 낙엽·이물질 유입 잦음'],
  asan:        ['둔포·모종 신도시와 구도심 농촌 혼재 지역', '신구 배관 혼재와 정화조 연결 노후 막힘'],
  eumseong:    ['금왕읍 산업단지·대소면 농촌 주거 혼재 지역', '공단 기름과 농촌 정화조 연결 복합 막힘'],
  jeungpyeong: ['증평읍 구도심·도안면 농촌 주거 밀집 지역', '노후 배관 스케일과 정화조 연결 이물질 유입'],
  jincheon:    ['진천읍 구도심·광혜원 산업단지 혼재 지역', '공단 기름과 구도심 노후 배관 스케일 복합'],
  cheonan:     ['불당·두정 신도시와 구도심 상권 혼재 지역', '신도시 잔재물과 구도심 기름 슬러지 복합 누적'],
  'cheongju-sangdang': ['상당구 구도심 주거·상권 혼재 지역', '노후 상권 기름과 구축 배관 스케일 누적'],
  'cheongju-seowon':   ['서원구 주거·산업 혼재 지역', '공단 기름과 주거 이물질 복합 누적'],
  'cheongju-cheongwon':['청원구 신도시·오창 산업단지 혼재 지역', '신도시 잔재물과 공단 기름 복합 막힘'],
  'cheongju-heungdeok':['흥덕구 가경·강서 신주거지 밀집 지역', '신도시 배관 잔재물과 초기 스케일 누적'],
};

// 서비스별 핵심정보 텍스트 생성
const aiSummaryVersions: Record<string, string[]> = {
  drain: [
    "{r} 하수구막힘 즉시 출동. 전문 장비로 배수구막힘·배관역류 당일 해결. 365일 24시간, 출장비 없음. 간단 작업부터 진행하며 미해결 시 0원. 현장 확인 후 견적.",
    "{r} 싱크대 하수구·화장실 배수구막힘 평균 25분 출동. 실력 좋은 전문가가 배관막힘 당일 처리. 출장비 없음. 간단 작업부터 진행. 예방팁 공유. 현장 확인 후 견적.",
    "{r} 욕실 하수구·배관막힘 365일 24시간 출동. 고객만족도 높은 업체. 전문 장비로 하수구역류·배수구막힘 당일 해결. 간단 작업부터 진행. 현장 확인 후 견적.",
    "{r} 화장실 하수구·아파트 배수구막힘 평균 30분 출동. 하수구막힘업체 중 출장비 없는 전문 업체. 미해결 시 0원. 간단 작업부터 진행. 현장 확인 후 견적.",
    "{r} 빌라 하수구·업장 배관막힘 즉시 출동. 365일 24시간 실력 좋은 전문가 방문. 배관역류·하수구막힘 전문 장비로 당일 해결. 간단 작업부터. 현장 견적.",
    "{r} 하수구막힘 평균 25분~30분 출동. 고객만족도 높은 업체. 출장비 없이 전문 장비로 배수구막힘 당일 처리. 미해결 시 0원. 예방팁 공유. 현장 확인 후 견적.",
    "{r} 배관막힘·하수구역류 즉시 출동. 365일 24시간 운영. 실력 좋은 전문가가 욕실·화장실 배수구막힘 당일 해결. 출장비 없음. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 싱크대 배수구·빌라 하수구막힘 전문 장비로 당일 해결. 평균 30분 출동. 고객만족도 높은 업체. 출장비 없음. 미해결 시 0원. 간단 작업부터. 현장 견적.",
    "{r} 아파트·업장 하수구막힘 365일 24시간 출동. 배관역류·배수구막힘 실력 좋은 전문가 처리. 출장비 없음. 예방팁 공유. 간단 작업부터 진행. 현장 확인 후 견적.",
    "{r} 화장실·욕실 하수구막힘 즉시 출동. 전문 장비로 배관막힘 평균 25분 내 해결. 출장비 없는 고객만족도 높은 업체. 미해결 시 0원. 현장 확인 후 견적.",
    "{r} 하수구막힘 평균 25분~30분 출동. 전문 장비·실력 좋은 전문가. 싱크대 하수구·화장실 배수구막힘 당일 처리. 출장비 없음. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 배수구막힘·배관역류 365일 24시간 즉시 출동. 고객만족도 높은 업체. 미해결 시 0원. 아파트·빌라 하수구막힘 전문 장비로 당일 해결. 현장 확인 후 견적.",
    "{r} 욕실·업장 배관막힘 실력 좋은 전문가가 평균 30분 출동. 출장비 없음. 하수구역류·배수구막힘 당일 처리. 예방팁 공유. 간단 작업부터 진행. 현장 견적.",
    "{r} 하수구막힘 즉시 출동. 365일 24시간 고객만족도 높은 업체. 전문 장비로 빌라·아파트 배수구막힘 당일 해결. 출장비 없음. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 화장실·싱크대 하수구막힘 평균 25분~30분 출동. 실력 좋은 전문가. 미해결 시 0원. 배관역류·배수구막힘 당일 처리. 출장비 없음. 예방팁 공유. 현장 견적.",
  ],
  sink: [
    "{r} 싱크대막힘 즉시 출동. 전문 장비로 싱크대 배수구막힘·기름때 당일 해결. 365일 24시간, 출장비 없음. 간단 작업부터 진행하며 미해결 시 0원. 현장 확인 후 견적.",
    "{r} 싱크대 하수구막힘 평균 25분 출동. 실력 좋은 전문가가 주방 배수구막힘·음식물 배관막힘 당일 처리. 출장비 없음. 예방팁 공유. 현장 확인 후 견적.",
    "{r} 주방 싱크대막힘 365일 24시간 출동. 고객만족도 높은 업체. 전문 장비로 싱크대 배수구막힘·기름 슬러지 당일 해결. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 싱크대 배수구막힘 평균 30분 출동. 출장비 없는 싱크대막힘 전문 업체. 미해결 시 0원. 음식물·기름때 배관막힘 당일 처리. 간단 작업부터. 현장 견적.",
    "{r} 싱크대막힘 즉시 출동. 365일 24시간 실력 좋은 전문가 방문. 주방 하수구막힘·배수구 역류 전문 장비로 당일 해결. 출장비 없음. 현장 확인 후 견적.",
    "{r} 싱크대 배수구막힘 평균 25분~30분 출동. 고객만족도 높은 업체. 기름 슬러지·음식물 배관막힘 당일 처리. 출장비 없음. 미해결 시 0원. 예방팁 공유. 현장 견적.",
    "{r} 주방 싱크대막힘 즉시 출동. 실력 좋은 전문가·전문 장비. 싱크대 하수구역류·배수구막힘 365일 24시간 당일 해결. 출장비 없음. 간단 작업부터. 현장 견적.",
    "{r} 싱크대 배수구·주방 배관막힘 전문 장비로 당일 해결. 평균 30분 출동. 출장비 없음. 고객만족도 높은 업체. 미해결 시 0원. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 싱크대막힘 365일 24시간 출동. 기름때·음식물 배수구막힘 실력 좋은 전문가 처리. 출장비 없음. 예방팁 공유. 간단 작업부터 진행. 현장 확인 후 견적.",
    "{r} 주방 싱크대 배수구막힘 즉시 출동. 전문 장비로 기름 슬러지·배관역류 평균 25분 내 해결. 출장비 없는 고객만족도 높은 업체. 미해결 시 0원. 현장 견적.",
    "{r} 싱크대막힘 평균 25분~30분 출동. 전문 장비·실력 좋은 전문가. 주방 하수구막힘·싱크대 배수구막힘 당일 처리. 출장비 없음. 간단 작업부터. 현장 견적.",
    "{r} 싱크대 배수구막힘·주방 배관역류 365일 24시간 즉시 출동. 고객만족도 높은 업체. 미해결 시 0원. 기름때·음식물 전문 장비로 당일 해결. 현장 확인 후 견적.",
    "{r} 싱크대막힘 실력 좋은 전문가가 평균 30분 출동. 출장비 없음. 주방 하수구막힘·배수구역류 당일 처리. 예방팁 공유. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 싱크대막힘 즉시 출동. 365일 24시간 고객만족도 높은 업체. 전문 장비로 주방 배수구막힘 당일 해결. 출장비 없음. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 주방 싱크대 하수구막힘 평균 25분~30분 출동. 실력 좋은 전문가. 미해결 시 0원. 기름 슬러지·배관막힘 당일 처리. 출장비 없음. 예방팁 공유. 현장 견적.",
  ],
  toilet: [
    "{r} 변기막힘 즉시 출동. 전문 장비로 변기막혔을때 관통기·석션·탈거 당일 해결. 365일 24시간, 출장비 없음. 간단 작업부터 진행하며 미해결 시 0원. 현장 확인 후 견적.",
    "{r} 변기막혔을때 평균 25분 출동. 실력 좋은 전문가가 물티슈·이물질 변기막힘 당일 처리. 출장비 없음. 관통기·석션 전문. 예방팁 공유. 현장 확인 후 견적.",
    "{r} 변기막힘 365일 24시간 출동. 고객만족도 높은 업체. 전문 장비로 전자담배·라이터 이물질 변기막힘 당일 해결. 탈거 작업 가능. 간단 작업부터. 현장 견적.",
    "{r} 변기막혔을때 평균 30분 출동. 출장비 없는 변기막힘 전문 업체. 미해결 시 0원. 물티슈·음식물쓰레기 변기막힘 관통기로 당일 처리. 현장 확인 후 견적.",
    "{r} 변기막힘 즉시 출동. 365일 24시간 실력 좋은 전문가 방문. 전자담배·이물질 변기막힘 관통기·석션·탈거로 당일 해결. 출장비 없음. 현장 확인 후 견적.",
    "{r} 변기막힘 평균 25분~30분 출동. 고객만족도 높은 업체. 물티슈·라이터 변기막힘 관통기·석션 당일 처리. 출장비 없음. 미해결 시 0원. 예방팁 공유. 현장 견적.",
    "{r} 변기막혔을때 즉시 출동. 실력 좋은 전문가·전문 장비. 이물질·음식물쓰레기 변기막힘 365일 24시간 당일 해결. 출장비 없음. 탈거 작업까지. 현장 견적.",
    "{r} 변기막힘 전문 장비로 당일 해결. 평균 30분 출동. 출장비 없음. 고객만족도 높은 업체. 미해결 시 0원. 물티슈·전자담배 이물질 관통기·석션으로 처리. 현장 견적.",
    "{r} 변기막힘 365일 24시간 출동. 라이터·이물질 변기막혔을때 실력 좋은 전문가 처리. 출장비 없음. 예방팁 공유. 간단 작업부터 진행. 현장 확인 후 견적.",
    "{r} 변기막힘 즉시 출동. 전문 장비로 물티슈·음식물 변기막혔을때 평균 25분 내 해결. 출장비 없는 고객만족도 높은 업체. 관통기·석션·탈거. 미해결 시 0원. 현장 견적.",
    "{r} 변기막힘 평균 25분~30분 출동. 전문 장비·실력 좋은 전문가. 전자담배·라이터 변기막힘 관통기·탈거로 당일 처리. 출장비 없음. 간단 작업부터. 현장 견적.",
    "{r} 변기막혔을때 365일 24시간 즉시 출동. 고객만족도 높은 업체. 미해결 시 0원. 이물질·음식물쓰레기 변기막힘 전문 장비로 당일 해결. 현장 확인 후 견적.",
    "{r} 변기막힘 실력 좋은 전문가가 평균 30분 출동. 출장비 없음. 물티슈·전자담배 변기막혔을때 관통기·석션 당일 처리. 예방팁 공유. 현장 확인 후 견적.",
    "{r} 변기막힘 즉시 출동. 365일 24시간 고객만족도 높은 업체. 전문 장비로 이물질 변기막힘 당일 해결. 출장비 없음. 탈거 작업 가능. 현장 확인 후 견적.",
    "{r} 변기막혔을때 평균 25분~30분 출동. 실력 좋은 전문가. 미해결 시 0원. 물티슈·라이터 변기막힘 관통기·석션·탈거 당일 처리. 출장비 없음. 현장 견적.",
  ],
  leak: [
    "{r} 누수탐지 즉시 출동. 전문 장비로 천장누수·벽누수 비파괴 탐지 당일 해결. 365일 24시간, 출장비 없음. 간단 작업부터 진행하며 미해결 시 0원. 현장 확인 후 견적.",
    "{r} 화장실누수·욕실누수 평균 25분 출동. 실력 좋은 전문가가 누수탐지·음향 진단 당일 처리. 출장비 없음. 아파트·빌라 누수 예방팁 공유. 현장 확인 후 견적.",
    "{r} 천장누수·벽누수 365일 24시간 출동. 고객만족도 높은 누수탐지업체. 전문 장비로 욕실·주방 누수 비파괴 탐지 당일 해결. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 누수탐지 평균 30분 출동. 출장비 없는 누수탐지 전문 업체. 미해결 시 0원. 화장실누수·베란다누수 열화상·음향 탐지 당일 처리. 현장 확인 후 견적.",
    "{r} 천장누수·욕실누수 즉시 출동. 365일 24시간 실력 좋은 전문가 방문. 벽누수·우수관누수 전문 장비로 비파괴 탐지 당일 해결. 출장비 없음. 현장 견적.",
    "{r} 누수탐지 평균 25분~30분 출동. 고객만족도 높은 업체. 화장실·베란다 누수 열화상·음향 탐지 당일 처리. 출장비 없음. 미해결 시 0원. 예방팁 공유. 현장 견적.",
    "{r} 욕실누수·주방누수 즉시 출동. 실력 좋은 전문가·전문 장비. 천장누수·벽누수 365일 24시간 비파괴 탐지 당일 해결. 출장비 없음. 현장 확인 후 견적.",
    "{r} 누수탐지 전문 장비로 당일 해결. 평균 30분 출동. 출장비 없음. 고객만족도 높은 업체. 미해결 시 0원. 아파트·빌라 천장누수·벽누수 비파괴 탐지. 현장 견적.",
    "{r} 누수탐지 365일 24시간 출동. 거실누수·상가누수 실력 좋은 전문가 처리. 출장비 없음. 예방팁 공유. 천장누수·욕실누수 간단 작업부터. 현장 확인 후 견적.",
    "{r} 누수탐지 즉시 출동. 전문 장비로 화장실누수·베란다누수 평균 25분 내 비파괴 탐지. 출장비 없는 고객만족도 높은 업체. 미해결 시 0원. 현장 확인 후 견적.",
    "{r} 누수탐지 평균 25분~30분 출동. 전문 장비·실력 좋은 전문가. 욕실누수·주방누수 열화상·음향 탐지 당일 처리. 출장비 없음. 간단 작업부터. 현장 견적.",
    "{r} 천장누수·벽누수 365일 24시간 즉시 출동. 고객만족도 높은 업체. 미해결 시 0원. 아파트·빌라·상가 누수탐지 전문 장비로 당일 해결. 현장 확인 후 견적.",
    "{r} 누수탐지 실력 좋은 전문가가 평균 30분 출동. 출장비 없음. 베란다누수·우수관누수 비파괴 탐지 당일 처리. 예방팁 공유. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 누수탐지 즉시 출동. 365일 24시간 고객만족도 높은 업체. 전문 장비로 화장실·욕실 누수 당일 해결. 출장비 없음. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 천장누수·욕실누수 평균 25분~30분 출동. 실력 좋은 전문가. 미해결 시 0원. 벽누수·베란다누수 비파괴 탐지 당일 처리. 출장비 없음. 현장 확인 후 견적.",
  ],
  faucet: [
    "{r} 수전교체 즉시 출동. 전문 장비로 싱크대수전고장·세면대수전교체 당일 해결. 365일 24시간, 출장비 없음. 부품 직접 지참. 간단 작업부터. 미해결 시 0원. 현장 견적.",
    "{r} 싱크대수전교체·세면대수도교체 평균 25분 출동. 실력 좋은 전문가가 싱크대물샘·세면대물샘 당일 처리. 부품 직접 지참. 출장비 없음. 예방팁 공유. 현장 견적.",
    "{r} 변기수리·변기교체 365일 24시간 출동. 고객만족도 높은 업체. 변기물샘·변기물안멈춤·변기소리 전문 장비로 당일 해결. 부품 지참. 간단 작업부터. 현장 견적.",
    "{r} 수전교체 평균 30분 출동. 출장비 없는 수전 전문 업체. 미해결 시 0원. 싱크대수전·세면대수전고장 부품 직접 지참해 당일 처리. 현장 확인 후 견적.",
    "{r} 싱크대수전고장·세면대교체 즉시 출동. 365일 24시간 실력 좋은 전문가 방문. 변기물안멈춤·변기소리 전문 장비로 당일 해결. 출장비 없음. 현장 확인 후 견적.",
    "{r} 수전교체 평균 25분~30분 출동. 고객만족도 높은 업체. 싱크대물샘·세면대물샘·변기물샘 부품 지참 당일 처리. 출장비 없음. 미해결 시 0원. 현장 견적.",
    "{r} 변기교체·수전교체 즉시 출동. 실력 좋은 전문가·전문 장비. 싱크대수전·세면대수전 365일 24시간 당일 해결. 부품 직접 지참. 출장비 없음. 현장 견적.",
    "{r} 수전교체·변기수리 전문 장비로 당일 해결. 평균 30분 출동. 부품 직접 지참. 고객만족도 높은 업체. 미해결 시 0원. 싱크대수전고장·변기소리 처리. 현장 견적.",
    "{r} 수전교체 365일 24시간 출동. 세면대물샘·싱크대물샘 실력 좋은 전문가 처리. 출장비 없음. 예방팁 공유. 부품 직접 지참. 간단 작업부터. 현장 확인 후 견적.",
    "{r} 수전교체 즉시 출동. 전문 장비로 변기물안멈춤·변기물샘 평균 25분 내 해결. 출장비 없는 고객만족도 높은 업체. 부품 지참. 미해결 시 0원. 현장 견적.",
    "{r} 수전교체 평균 25분~30분 출동. 전문 장비·실력 좋은 전문가. 싱크대수전교체·세면대수도교체 부품 지참 당일 처리. 출장비 없음. 현장 확인 후 견적.",
    "{r} 변기수리·수전교체 365일 24시간 즉시 출동. 고객만족도 높은 업체. 미해결 시 0원. 변기소리·변기물안멈춤·싱크대물샘 전문 장비로 당일 해결. 현장 견적.",
    "{r} 수전교체 실력 좋은 전문가가 평균 30분 출동. 출장비 없음. 세면대교체·변기교체 부품 직접 지참 당일 처리. 예방팁 공유. 간단 작업부터. 현장 견적.",
    "{r} 수전교체·변기수리 즉시 출동. 365일 24시간 고객만족도 높은 업체. 전문 장비로 싱크대수전고장 당일 해결. 출장비 없음. 부품 지참. 현장 확인 후 견적.",
    "{r} 싱크대수전교체·세면대수전고장 평균 25분~30분 출동. 실력 좋은 전문가. 미해결 시 0원. 변기물샘·변기소리 부품 지참 당일 처리. 출장비 없음. 현장 견적.",
  ],
};

function buildAiSummary(service: string, regionKey: string, regName: string, dongs3: string, brand: string, phone: string): string {
  const versions = aiSummaryVersions[service] ?? aiSummaryVersions['faucet'];
  const hash = regionKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const ver = versions[hash % versions.length];
  return ver.replace(/{r}/g, regName);
}

function buildContent(svc: any, regionIndex: number, slugSalt: number) {
  return {
    intro: pickVariant(svc.introVariants, svc.intro, regionIndex, 0, slugSalt),
    extraNote: pickVariant(svc.extraNoteVariants, svc.extraNote, regionIndex, 1, slugSalt),
    scope: pickVariant(svc.scopeVariants, svc.scope, regionIndex, 2, slugSalt),
    causes: pickVariant(svc.causesVariants, svc.causes, regionIndex, 3, slugSalt),
    tips: pickVariant(svc.tipsVariants, svc.tips, regionIndex, 4, slugSalt),
    equipment: pickVariant(svc.equipmentVariants, svc.equipment, regionIndex, 5, slugSalt),
    costInfo: pickVariant(
      svc.costInfoVariants,
      "막힘 정도와 작업 범위에 따라 비용이 달라지기 때문에, 방문 전 상담을 통해 예상 비용을 먼저 안내드리고 현장에서 최종 확인 후 작업을 진행합니다. 숨겨진 추가 비용 없이 투명하게 안내드려요.",
      regionIndex,
      6,
      slugSalt
    ),
    neglect: pickVariant(
      svc.neglectVariants,
      [
        "막힘이 오래되면 악취가 심해지고 벌레가 발생할 수 있어요.",
        "역류가 시작되면 바닥 침수, 아랫집 피해로 이어질 수 있어요.",
        "초기엔 간단한 작업으로 끝나지만, 방치하면 배관 교체 등 큰 공사가 필요해질 수 있어요.",
      ],
      regionIndex,
      7,
      slugSalt
    ),
    searchIntent: pickVariant(svc.searchIntentVariants, null, regionIndex, 8, slugSalt) as string | null,
    longtailFaqs: rotateFaqs(svc.longtailFaqs ?? [], regionIndex, 9, slugSalt),
  };
}

function getData(service: string, region: string) {
  const svc = (services as Record<string, any>)[service];
  const reg = (regions as Record<string, (typeof regions)[RegionKey]>)[region];
  if (!svc || !reg) return null;
  return { svc, reg };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; region: string }>;
}): Promise<Metadata> {
  const { service, region } = await params;
  const data = getData(service, region);
  if (!data) return {};
  const { svc, reg } = data;
  const phrase = pickSymptomPhrase(region, svc.symptomPhrases);
  // phrase가 "막힘"으로 끝나면 svc.label이 포함된 케이스 — 그대로 두면 title이 짧아지므로
  // " 출장"을 추가해 최소 22자 이상 확보하고, svc.label도 명시
  // phrase가 "막힘"으로 끝날 때: phrase가 이미 svc.label을 포함하면 label 생략 후 " 출장" 추가
  // (예: svc.label="싱크대막힘", phrase="싱크대막힘" → "싱크대막힘 출장"으로 중복 방지)
  const titleBase = phrase.endsWith("막힘")
    ? phrase.includes(svc.label)
      ? `${reg.name} ${phrase} 출장`
      : `${reg.name} ${svc.label} ${phrase} 출장`
    : `${reg.name} ${svc.label} ${phrase}`;
  const title = `${titleBase} | ${siteConfig.brand}`;
  const regionIndexForMeta = Object.keys(regions).indexOf(region);
  const introForMeta = pickVariant(svc.introVariants, svc.intro, regionIndexForMeta, 0);
  // description: 지역 고유 문장(intro)을 앞에 두어 서치어드바이저 중복 판정 회피
  const dongs3 = reg.dongs.slice(0, 3).join("·");
  const description = `${introForMeta} ${reg.name}(${dongs3} 등) ${svc.label} 출장 — ${siteConfig.brand} 365일 24시간.`;
  const aiSummary = `${reg.name} ${svc.label} 출장 서비스. ${siteConfig.brand} 365일 24시간 운영. 평균 30분 이내 방문. 현장 확인 후 견적. 전화: ${siteConfig.phone}`;
  const ogImage = `${siteConfig.baseUrl}${pickPhotos(service, regionIndexForMeta).hero}`;
  return {
    title,
    description,
    // AI 브리핑/스니펫 최적화
    other: {

      "summary": aiSummary,
      "robots": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      "geo.region": reg.area === "서울특별시" ? "KR-11" : reg.area === "경기·인천" ? "KR-41" : "KR-44",
      "geo.placename": reg.name,
    },
    alternates: { canonical: `${siteConfig.baseUrl}/${service}/${region}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.baseUrl}/${service}/${region}`,
      siteName: siteConfig.brand,
      images: [ogImage],
      locale: "ko_KR",
      type: "website",
    },
    robots: { index: true, follow: true },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ServiceRegionPage({
  params,
}: {
  params: Promise<{ service: string; region: string }>;
}) {
  const { service, region } = await params;
  const data = getData(service, region);
  if (!data) notFound();
  const { svc, reg } = data;
  const phrase = pickSymptomPhrase(region, svc.symptomPhrases);
  const h1 = phrase.endsWith("막힘") ? `${reg.name} ${phrase}` : `${reg.name} ${svc.label} ${phrase}`;
  const regionIndex = Object.keys(regions).indexOf(region);
  const photos = pickPhotos(service, regionIndex);

  const slugSalt = region.length; // slug 길이로 ri 주기 충돌 방지
  const content = buildContent(svc, regionIndex, slugSalt);
  const nearby = getNearbyRegions(region);
  const dongs3 = reg.dongs.slice(0, 3).join("·");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PlumbingService",
    name: `${siteConfig.brand} ${reg.name} ${svc.label}`,
    areaServed: {
      "@type": "AdministrativeArea",
      name: reg.name,
      description: `${reg.name} 전 지역(${reg.dongs.join(", ")}) 출장 가능`,
    },
    telephone: siteConfig.phone,
    url: `${siteConfig.baseUrl}/${service}/${region}`,
    priceRange: "KRW",
    openingHours: "Mo-Su 00:00-23:59",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${siteConfig.brand} 서비스`,
      itemListElement: Object.values(services).map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.label },
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": siteConfig.baseUrl },
      { "@type": "ListItem", "position": 2, "name": svc.label, "item": `${siteConfig.baseUrl}/${service}` },
      { "@type": "ListItem", "position": 3, "name": `${reg.name} ${svc.label}`, "item": `${siteConfig.baseUrl}/${service}/${region}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${reg.name}에서 ${svc.label} 출장비는 얼마인가요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "막힘 정도와 작업 범위에 따라 달라지며, 방문 전 전화 상담으로 예상 비용을 먼저 안내드립니다.",
        },
      },
      {
        "@type": "Question",
        name: `${reg.name} 전 지역 출장이 가능한가요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `네, ${reg.name} 전 지역(${reg.dongs.join(", ")}) 출장이 가능합니다.`,
        },
      },
      ...content.longtailFaqs.slice(0, 2).map((f: any) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ],
  };

  // HowTo Schema - 네이버AI·ChatGPT 핵심 (단계별 가이드)
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${reg.name} ${svc.label} 출장 요청 방법`,
    description: `${reg.name}에서 ${svc.label} 발생 시 ${siteConfig.brand}에 출장 요청하는 방법입니다.`,
    totalTime: "PT30M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "KRW", value: "전화 상담 후 안내" },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "증상 확인",
        text: `${reg.name} 현장에서 ${svc.label} 증상을 확인합니다. 물이 역류하거나 배수 속도가 느려진 경우 즉시 연락하세요.`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "전화 상담 및 출동 요청",
        text: `${siteConfig.phone}으로 전화해 ${reg.name} 주소와 증상을 설명하면 평균 30분 이내 기술자가 출동합니다.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "현장 내시경 진단",
        text: "기술자가 내시경 카메라로 배관 내부를 촬영해 막힘 원인과 위치를 정확히 파악합니다.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "견적 확인 및 작업 동의",
        text: "진단 결과와 예상 비용을 안내받고 동의 후 작업을 시작합니다. 숨겨진 추가 비용은 없습니다.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "고압세척 및 통수 확인",
        text: "전문 장비로 막힘을 제거하고 통수 상태를 고객과 함께 확인한 뒤 작업을 완료합니다.",
      },
    ],
  };

  // WebPage + Speakable Schema - 구글AI·제미나이 최적화
  const titleForSchema = `${h1} | ${siteConfig.brand}`;
  const descriptionForSchema = `${reg.name} ${svc.label} 출장 서비스. ${siteConfig.brand} 365일 24시간 운영.`;
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: titleForSchema,
    description: descriptionForSchema,
    url: `${siteConfig.baseUrl}/${service}/${region}`,
    inLanguage: "ko",
    dateModified: new Date().toISOString().split("T")[0],
    speakable: {
      "@type": "SpeakableSpecification",
      // AI가 핵심 내용으로 발췌할 CSS 셀렉터
      cssSelector: ["h1", ".ai-summary", ".faq-section"],
    },
    mainEntity: {
      "@type": "LocalBusiness",
      "@id": `${siteConfig.baseUrl}/#business`,
      name: siteConfig.brand,
      telephone: siteConfig.phone,
      areaServed: reg.name,
      openingHours: "Mo-Su 00:00-23:59",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <Header currentService={service} />

      <main className="bg-white pb-16">
        {/* 히어로 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1f4d] via-[#0d2c6b] to-[#1a4fb8] px-5 py-14 text-center text-white">
          <p className="text-sm text-blue-200">
            <span className="opacity-80">Home</span> ›{" "}
            <span className="opacity-80">배관 서비스</span> › {reg.name}
          </p>
          <p className="mt-4 text-sm font-semibold text-orange-300">
            365일 24시간 긴급출동
          </p>
          <h1 className="mt-2 text-3xl font-black italic tracking-tight md:text-5xl">
            {h1}
          </h1>
          <p className="mt-4 text-base text-blue-100">
            평균 30분 이내 방문 · 출장비 상담 후 작업 · {reg.dongs.length}개 동 전 지역 가능
          </p>
        </section>

        {/* AI 브리핑 요약 정의문 - 스니펫 최적화 (hero 바로 아래) */}
        <section className="ai-summary mx-auto max-w-4xl px-5 pt-6 pb-2">
          <div className="rounded-xl border-l-4 border-[#0d2c6b] bg-blue-50 px-5 py-4">
            <p className="text-sm font-bold text-[#0d2c6b]">📌 {reg.name} {svc.label} 핵심 정보</p>
            <p className="mt-1 text-sm text-gray-700">
              {buildAiSummary(service, region, reg.name, dongs3, siteConfig.brand, siteConfig.phone)}
            </p>
          </div>
        </section>

        {/* 한 줄 카피 + 대표 사진 */}
        <section className="mx-auto max-w-4xl px-5 py-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {reg.name} {svc.label}{" "}
            <span className="text-orange-500">말끔히</span> 해결해드립니다
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            &quot;{siteConfig.brand}는 막힘 진단부터 작업까지 한 번의 방문으로 해결합니다&quot;
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <PhotoSlot label={`${reg.name} 배관 출장 현장 사진`} ratio="4/3" src={photos.hero} priority />
          </div>
        </section>

        {/* 원인별 해결방법 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">01</span>
            배관 막힘 원인별 해결방법
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">원인</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">해결방법</th>
                </tr>
              </thead>
              <tbody>
            {content.causes.map((c: any, i: number) => (
                  <tr key={c.cause} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="border-t px-4 py-3 text-gray-800">{c.cause}</td>
                    <td className="border-t px-4 py-3 text-gray-600">{c.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 출장 가능 동 목록 — 01과 02 사이 위치 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <div className="rounded-xl border border-[#0d2c6b]/20 bg-blue-50 p-6">
            <h2 className="font-bold text-[#0d2c6b]">
              출장 가능 동 목록
            </h2>
            <p className="mt-2 text-gray-700">{reg.dongs.join(" · ")}</p>
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(reg.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d2c6b] underline"
            >
              🗺️ {reg.name} 전체 지도에서 보기
            </a>
            {(nearby.prev || nearby.next) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#0d2c6b]/10 pt-4 text-sm">
                <span className="font-semibold text-[#0d2c6b]">인근 지역 출장 안내</span>
                {nearby.prev && (
                  <a
                    href={`/${service}/${nearby.prev}`}
                    className="rounded-full border border-[#0d2c6b]/30 px-3 py-1 text-[#0d2c6b] hover:bg-[#0d2c6b] hover:text-white"
                  >
                    ← {regions[nearby.prev as keyof typeof regions].name}
                  </a>
                )}
                {nearby.next && (
                  <a
                    href={`/${service}/${nearby.next}`}
                    className="rounded-full border border-[#0d2c6b]/30 px-3 py-1 text-[#0d2c6b] hover:bg-[#0d2c6b] hover:text-white"
                  >
                    {regions[nearby.next as keyof typeof regions].name} →
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 자주 묻는 질문 (롱테일 키워드) - faq-section: Speakable Schema 연동 */}
        <section className="faq-section mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">02</span>
            {reg.name} 배관 막힘 자주 묻는 질문
          </h2>
          <div className="mt-4 space-y-3">
            {content.longtailFaqs.map((f: any) => (
              <details key={f.q} className="group rounded-lg border border-gray-200 p-4">
                <summary className="cursor-pointer list-none font-bold text-gray-900">
                  Q. {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">A. {f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 예방 팁 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">03</span>
            배관 막힘 예방 팁
          </h2>
          <ul className="mt-4 space-y-3">
            {content.tips.map((tip: string) => (
              <li key={tip} className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-gray-700">
                <span>✅</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 장비 소개 — 04 위치 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">04</span>
            출장 작업 장비 소개
          </h2>
          <div className="mt-4 space-y-4">
            {content.equipment.map((eq: any) => (
              <div key={eq.name} className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">🔧 {eq.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{eq.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 막힘 원인 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">05</span>
            {reg.name} 배관 막힘, 왜 자주 발생할까요?
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">{content.intro}</p>
          <p className="mt-3 leading-relaxed text-gray-700">
            {reg.feature} {reg.feature2}
          </p>
          <p className="mt-3 leading-relaxed text-gray-700">
            이런 환경에서는 <strong className="text-[#0d2c6b]">{reg.problem}</strong>
            로 인한 배관 막힘이 빈번하게 발생합니다.
          </p>
          {reg.seasonalNote && (
            <p className="mt-3 leading-relaxed text-gray-700">{reg.seasonalNote}</p>
          )}
          <a
            href={`https://map.naver.com/v5/search/${encodeURIComponent(reg.govOffice)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0d2c6b] underline"
          >
            📍 {reg.govOffice} 위치 보기 (네이버 지도)
          </a>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PhotoSlot label={`${reg.name} 배관 막힘 작업 전 현장`} ratio="1/1" src={photos.before} />
            <PhotoSlot label={`${reg.name} 내시경 카메라 진단`} ratio="1/1" src={photos.diagnosis} />
            <PhotoSlot label={`${reg.name} 배관 청소 후 제거된 이물질`} ratio="1/1" src={photos.removed} />
          </div>
        </section>

        {/* 작업 범위 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">06</span>
            출장 작업 범위
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            {siteConfig.brand}는 {reg.name} 전 지역을 30분 이내 출장하여{" "}
            {content.scope} 신속하게 해결해드립니다.
          </p>
          {reg.localTip && (
            <p className="mt-3 leading-relaxed text-gray-700">{reg.localTip}</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label={`${reg.name} 출장 작업 진행 중`} ratio="4/3" src={photos.onsiteWork} />
            <PhotoSlot label={`${reg.name} 배관 내시경 점검 현장`} ratio="4/3" src={photos.onsiteDiagnosis} />
          </div>

          <div className="mt-5 rounded-lg bg-gray-50 p-5">
            <p className="leading-relaxed text-gray-700">{content.extraNote}</p>
          </div>
        </section>

        {/* 검색 의도 — 롱테일 키워드 자연 반영 */}
        {content.searchIntent && (
          <section className="mx-auto max-w-4xl px-5 py-10">
            <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-5">
              <p className="leading-relaxed text-gray-700">{content.searchIntent}</p>
            </div>
          </section>
        )}

        {/* 방치하면 안되는 이유 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">07</span>
            방치하면 안 되는 이유
          </h2>
          <ul className="mt-3 space-y-2 leading-relaxed text-gray-700">
            {content.neglect.map((n: string) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <PhotoSlot label={`${reg.name} 방치된 배관 내부 상태`} ratio="16/9" src={photos.neglectBefore} />
            <PhotoSlot label={`${reg.name} 배관 청소 후 제거된 이물질`} ratio="16/9" src={photos.neglectAfter} />
          </div>
        </section>

        {/* 비용 안내 */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#0d2c6b]">
            <span className="rounded bg-[#0d2c6b] px-2 py-1 text-xs text-white">08</span>
            출장 비용 안내
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">{content.costInfo}</p>
        </section>

        {/* 마무리 CTA */}
        <section className="mx-auto max-w-4xl px-5 py-10">
          <p className="text-center leading-relaxed text-gray-600">
            배관 막힘은 방치할수록 악취와 역류로 이어질 수 있습니다. {reg.name} 증상이 보이면 미루지 말고 바로 연락 주세요.
          </p>
          <div className="mt-8 text-center">
            <a
              href={`tel:${siteConfig.phone}`}
              className="inline-block rounded-full bg-[#0d2c6b] px-8 py-4 text-lg font-bold text-white"
            >
              지금 전화 상담 {siteConfig.phone}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href={siteConfig.mainSiteUrls[service] ?? siteConfig.mainSiteUrls.drain}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[#0d2c6b] underline"
            >
              {siteConfig.brand} 공식 페이지 바로가기
            </a>
            <span className="text-gray-300">|</span>
            <a
              href={siteConfig.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0d2c6b] underline"
            >
              네이버 블로그에서 작업 후기 더 보기
            </a>
          </div>
        </section>

        {/* 지역 디렉토리 — 페이지 맨 아래 위치 */}
        <section className="mx-auto max-w-5xl px-5 py-10">
          <RegionDirectory serviceKey={service} serviceLabel={svc.label} currentArea={reg.area} />
        </section>

      </main>

      <Footer />
    </>
  );
}
