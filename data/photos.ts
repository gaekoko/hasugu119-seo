export const photoLibrary = {
  hero: ["clog-removed-1", "clog-removed-2", "clog-removed-3", "clog-removed-4"],
  before: [
    "before-pipe-1",
    "dirty-drain-1",
    "pipe-fitting-1",
    "pipe-fitting-2",
    "pipe-fitting-3",
    "pipe-fitting-4",
  ],
  diagnosis: [
    "camera-diagnosis-1",
    "camera-diagnosis-2",
    "camera-diagnosis-3",
    "camera-diagnosis-4",
    "camera-diagnosis-5",
    "camera-diagnosis-6",
    "camera-diagnosis-7",
  ],
  removed: ["clog-removed-2", "clog-removed-3", "clog-removed-1", "clog-removed-4"],
  onsite: [
    "onsite-work-1",
    "onsite-work-2",
    "onsite-work-3",
    "onsite-work-4",
    "onsite-work-5",
    "onsite-work-6",
    "sink-faucet-1",
    "equipment-1",
    "team-work-1",
    "toilet-work-1",
    "toilet-work-2",
  ],
  neglect: [
    "dirty-drain-1",
    "before-pipe-1",
    "pipe-fitting-1",
    "pipe-fitting-2",
    "pipe-fitting-5",
    "pipe-fitting-6",
  ],
};

function pickFrom(list: string[], index: number, offset = 0) {
  const i = (index + offset) % list.length;
  return `/photos/${list[i]}.jpg`;
}

export function pickPhotos(regionIndex: number) {
  return {
    hero: pickFrom(photoLibrary.hero, regionIndex),
    before: pickFrom(photoLibrary.before, regionIndex),
    diagnosis: pickFrom(photoLibrary.diagnosis, regionIndex),
    removed: pickFrom(photoLibrary.removed, regionIndex, 1),
    onsiteWork: pickFrom(photoLibrary.onsite, regionIndex),
    onsiteDiagnosis: pickFrom(photoLibrary.diagnosis, regionIndex, 2),
    neglectBefore: pickFrom(photoLibrary.neglect, regionIndex),
    neglectAfter: pickFrom(photoLibrary.removed, regionIndex, 2),
  };
}
