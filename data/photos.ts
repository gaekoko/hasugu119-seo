// 서비스별(하수구/싱크대/변기) 사진 풀
// 같은 사진이 모든 서비스 페이지에 똑같이 나오지 않도록 서비스별로 분리했습니다.
export const photoLibraries: Record<string, Record<string, string[]>> = {
  drain: {
    hero: ["clog-removed-1", "clog-removed-2", "clog-removed-3", "clog-removed-4", "drain-clog-removed-01", "drain-clog-removed-02"],
    before: [
      "before-pipe-1",
      "dirty-drain-1",
      "pipe-fitting-1",
      "pipe-fitting-2",
      "pipe-fitting-3",
      "pipe-fitting-4",
      "pipe-joint-corroded-01",
      "pipe-joint-food-debris-01",
      "drain-grate-debris-01",
      "drain-grate-debris-02",
    ],
    diagnosis: [
      "camera-diagnosis-1",
      "camera-diagnosis-2",
      "camera-diagnosis-3",
      "camera-diagnosis-4",
      "camera-diagnosis-5",
      "camera-diagnosis-6",
      "camera-diagnosis-7",
      "pipe-scope-monitor-01",
      "pipe-scope-monitor-02",
      "pipe-scope-monitor-03",
      "pipe-scope-monitor-04",
      "pipe-scope-monitor-05",
      "pipe-interior-closeup-01",
      "pipe-interior-closeup-02",
      "manifold-inspection-01",
      "manifold-inspection-02",
    ],
    removed: [
      "clog-removed-2",
      "clog-removed-3",
      "clog-removed-1",
      "clog-removed-4",
      "drain-debris-removed-01",
      "drain-debris-removed-02",
      "drain-debris-removed-03",
      "drain-debris-removed-04",
      "drain-debris-removed-05",
      "drain-trap-disassembly-01",
      "drain-trap-disassembly-02",
      "pipe-clog-ring-01",
    ],
    onsite: [
      "onsite-work-1",
      "onsite-work-2",
      "onsite-work-3",
      "onsite-work-4",
      "onsite-work-5",
      "onsite-work-6",
      "equipment-1",
      "team-work-1",
      "drain-machine-equipment-01",
      "drain-machine-equipment-02",
      "drain-machine-equipment-03",
      "drain-machine-equipment-04",
      "catch-basin-open-01",
      "catch-basin-interior-01",
    ],
    neglect: [
      "dirty-drain-1",
      "before-pipe-1",
      "pipe-fitting-5",
      "pipe-fitting-6",
      "catch-basin-debris-bag-01",
      "catch-basin-debris-bag-02",
      "catch-basin-cigarette-debris-01",
    ],
  },
  sink: {
    hero: ["sink-faucet-1", "drain-clog-removed-03", "drain-clog-removed-04", "kitchen-pipes-before-01"],
    before: [
      "sink-before-1",
      "kitchen-cabinet-before-01",
      "kitchen-cabinet-before-02",
      "kitchen-pipes-before-01",
      "kitchen-pipes-before-02",
      "kitchen-pipes-before-03",
      "kitchen-pipes-before-04",
    ],
    diagnosis: [
      "kitchen-floor-drain-open-01",
      "kitchen-floor-drain-open-02",
      "camera-diagnosis-1",
      "camera-diagnosis-2",
      "camera-diagnosis-3",
    ],
    removed: [
      "drain-debris-removed-06",
      "drain-debris-removed-07",
      "drain-debris-removed-08",
      "clog-removed-1",
      "clog-removed-2",
    ],
    onsite: [
      "technician-inspecting-drain-01",
      "service-van-street-01",
      "service-van-street-02",
      "service-van-street-03",
      "onsite-work-1",
      "onsite-work-2",
    ],
    neglect: [
      "kitchen-floor-drain-before-01",
      "kitchen-floor-drain-before-02",
      "kitchen-pipes-before-02",
      "kitchen-pipes-before-03",
    ],
  },
  toilet: {
    hero: ["urinal-clog-removal-01", "urinal-clog-removal-02", "toilet-work-1", "toilet-work-2"],
    before: ["urinal-overview-before-01", "bathroom-overview-01"],
    diagnosis: [
      "urinal-drain-closeup-01",
      "leak-repair-manifold-01",
      "camera-diagnosis-4",
      "camera-diagnosis-5",
      "camera-diagnosis-6",
    ],
    removed: [
      "toilet-leak-repair-01",
      "toilet-leak-repair-02",
      "toilet-leak-repair-03",
      "toilet-leak-repair-04",
      "toilet-leak-repair-05",
      "urinal-clog-removal-03",
    ],
    onsite: ["worksite-tools-01", "service-van-street-01", "service-van-street-02", "team-work-1"],
    neglect: ["urinal-overview-before-01", "bathroom-overview-01"],
  },
};

function pickFrom(list: string[], index: number, offset = 0) {
  const i = (index + offset) % list.length;
  return `/photos/${list[i]}.jpg`;
}

export function pickPhotos(service: string, regionIndex: number) {
  const lib = photoLibraries[service] ?? photoLibraries.drain;
  return {
    hero: pickFrom(lib.hero, regionIndex),
    before: pickFrom(lib.before, regionIndex),
    diagnosis: pickFrom(lib.diagnosis, regionIndex),
    removed: pickFrom(lib.removed, regionIndex, 1),
    onsiteWork: pickFrom(lib.onsite, regionIndex),
    onsiteDiagnosis: pickFrom(lib.diagnosis, regionIndex, 2),
    neglectBefore: pickFrom(lib.neglect, regionIndex),
    neglectAfter: pickFrom(lib.removed, regionIndex, 2),
  };
}

// 작업 영상 풀 — 서비스 + 지역 인덱스를 함께 써서 같은 영상이 반복되지 않도록 분배
const videoPool = [
  "onsite-work-clip-1",
  "work-video-01",
  "work-video-02",
  "work-video-03",
  "work-video-04",
  "work-video-05",
  "work-video-06",
  "work-video-07",
  "work-video-08",
  "work-video-09",
  "work-video-10",
  "work-video-11",
  "work-video-12",
  "work-video-13",
];

export function pickVideo(service: string, regionIndex: number) {
  const serviceOffset = service === "sink" ? 5 : service === "toilet" ? 9 : 0;
  const idx = (regionIndex + serviceOffset) % videoPool.length;
  return `/videos/${videoPool[idx]}.mp4`;
}
