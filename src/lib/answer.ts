export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/["""'']/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

export type ScoreResult = {
  exact: boolean;
  nearMiss: boolean;
  distance: number;
};

export function scoreAnswer(typed: string, expected: string): ScoreResult {
  const a = normalizeAnswer(typed);
  const b = normalizeAnswer(expected);

  if (!a) {
    return { exact: false, nearMiss: false, distance: b.length };
  }

  if (a === b) {
    return { exact: true, nearMiss: false, distance: 0 };
  }

  const distance = levenshtein(a, b);
  const threshold = Math.max(2, Math.ceil(b.length * 0.1));
  const nearMiss = distance <= threshold;

  return { exact: false, nearMiss, distance };
}
