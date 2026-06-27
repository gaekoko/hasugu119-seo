// 작은 풀(pool)을 50개 지역에 나눠 쓸 때, 단순 나머지 연산(% n)만 쓰면
// n개 지역마다 정확히 똑같은 조합이 반복되는 문제가 생긴다.
// (예: 풀 12개 -> 12번째 지역마다 동일한 4개 FAQ가 그대로 반복)
//
// cyclePick은 "몇 번째 사이클(바퀴)"인지에 따라 곱수(multiplier)와 더할 값을 바꿔서,
// 같은 (regionIndex % n) 값이라도 사이클이 다르면 다른 인덱스가 나오도록 한다.

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const CANDIDATE_MULTIPLIERS = [1, 5, 7, 11, 13, 17, 19, 23, 29, 31];

export function cyclePick(poolLength: number, regionIndex: number, salt = 0): number {
  if (poolLength <= 0) return 0;
  const cycle = Math.floor(regionIndex / poolLength) + salt;
  const coprime = CANDIDATE_MULTIPLIERS.filter((m) => gcd(m, poolLength) === 1);
  const mult = coprime.length > 0 ? coprime[cycle % coprime.length] : 1;
  const add = ((cycle % poolLength) + poolLength) % poolLength;
  const base = ((regionIndex % poolLength) + poolLength) % poolLength;
  return (base * mult + add) % poolLength;
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

// n개 중 k개를 고르는 모든 조합(C(n,k)개)에 0..C(n,k)-1 번호를 매겨서,
// 그 번호(rank)에 해당하는 조합을 그대로 복원한다 (조합론적 unranking).
// 이렇게 하면 "연속된 k개만 고르기"보다 훨씬 많은 조합이 나와서,
// 49개 지역이라도 (조합 수가 충분히 크면) 서로 다른 조합을 받을 수 있다.
function combinationAtRank(n: number, k: number, rank: number): number[] {
  const result: number[] = [];
  let x = 0;
  let remaining = rank;
  for (let i = 0; i < k; i++) {
    while (x < n && binomial(n - x - 1, k - i - 1) <= remaining) {
      remaining -= binomial(n - x - 1, k - i - 1);
      x += 1;
    }
    result.push(x);
    x += 1;
  }
  return result;
}

// pool에서 k개를 골라 지역마다 (조합 수가 허용하는 한) 서로 다른 조합이 나오게 한다.
export function pickDistinctCombo<T>(pool: T[], regionIndex: number, k: number, salt = 0): T[] {
  const n = pool.length;
  const take = Math.min(k, n);
  const totalCombos = binomial(n, take);
  const rank = cyclePick(totalCombos, regionIndex, salt);
  const indices = combinationAtRank(n, take, rank);
  return indices.map((i) => pool[i]);
}
