export type SrsGrade = "again" | "hard" | "good" | "easy";

export type SrsState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  status: "new" | "learning" | "known" | "hard";
};

/** SM-2 inspired scheduler for flashcards */
export function applySrs(current: SrsState, grade: SrsGrade, now = new Date()): SrsState {
  let { ease, intervalDays, repetitions } = current;

  if (grade === "again") {
    return {
      ease: Math.max(1.3, ease - 0.2),
      intervalDays: 0,
      repetitions: 0,
      dueAt: addMinutes(now, 10),
      status: "hard",
    };
  }

  if (grade === "hard") {
    ease = Math.max(1.3, ease - 0.15);
    if (repetitions === 0) {
      intervalDays = 1;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    }
    repetitions += 1;
    return {
      ease,
      intervalDays,
      repetitions,
      dueAt: addDays(now, intervalDays),
      status: repetitions >= 3 ? "known" : "learning",
    };
  }

  // good / easy
  const easeDelta = grade === "easy" ? 0.15 : 0;
  ease = Math.max(1.3, ease + easeDelta);

  if (repetitions === 0) {
    intervalDays = grade === "easy" ? 3 : 1;
  } else if (repetitions === 1) {
    intervalDays = grade === "easy" ? 7 : 3;
  } else {
    const factor = grade === "easy" ? ease * 1.3 : ease;
    intervalDays = Math.max(1, Math.round(intervalDays * factor));
  }

  repetitions += 1;

  return {
    ease,
    intervalDays,
    repetitions,
    dueAt: addDays(now, intervalDays),
    status: repetitions >= 2 ? "known" : "learning",
  };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function defaultReviewState(now = new Date()): SrsState {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now,
    status: "new",
  };
}
