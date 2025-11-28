interface StudentInfo {
  name: string;
  dateOfBirth?: string;
  className?: string;
  studentCode?: string;
  studentId?: number;
  accessToken?: string;
}

interface LocalAttempt {
  attemptId: string;
  quizId: number;
  studentInfo: StudentInfo;
  startAt: string;
  answers: Record<number, string>; // questionId -> selected_option
  serverAttemptId?: number; // ID của attempt trong database
}

const STUDENT_INFO_KEY = "quizteacherfe_student_info";
const LOCAL_ATTEMPTS_KEY = "quizteacherfe_local_attempts";

export const studentStorage = {
  saveStudentInfo(info: StudentInfo) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STUDENT_INFO_KEY, JSON.stringify(info));
  },

  getStudentInfo(): StudentInfo | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(STUDENT_INFO_KEY);
      return raw ? (JSON.parse(raw) as StudentInfo) : null;
    } catch {
      return null;
    }
  },

  clearStudentInfo() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(STUDENT_INFO_KEY);
  },

  saveLocalAttempt(attempt: LocalAttempt) {
    if (typeof window === "undefined") return;
    const attempts = this.getLocalAttempts();
    attempts[attempt.attemptId] = attempt;
    window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(attempts));
  },

  getLocalAttempt(attemptId: string): LocalAttempt | null {
    if (typeof window === "undefined") return null;
    const attempts = this.getLocalAttempts();
    return attempts[attemptId] || null;
  },

  getLocalAttempts(): Record<string, LocalAttempt> {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(LOCAL_ATTEMPTS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, LocalAttempt>) : {};
    } catch {
      return {};
    }
  },

  updateAnswer(attemptId: string, questionId: number, selectedOption: string) {
    if (typeof window === "undefined") return;
    const attempts = this.getLocalAttempts();
    if (attempts[attemptId]) {
      attempts[attemptId].answers[questionId] = selectedOption;
      window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(attempts));
    }
  },

  getLocalAttemptByQuizId(quizId: number): LocalAttempt | null {
    if (typeof window === "undefined") return null;
    const attempts = this.getLocalAttempts();
    const attemptId = Object.keys(attempts).find(
      (id) => attempts[id].quizId === quizId
    );
    return attemptId ? attempts[attemptId] : null;
  },

  removeLocalAttempt(attemptId: string) {
    if (typeof window === "undefined") return;
    const attempts = this.getLocalAttempts();
    delete attempts[attemptId];
    window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(attempts));
  },

  removeLocalAttemptByQuizId(quizId: number) {
    if (typeof window === "undefined") return;
    const attempts = this.getLocalAttempts();
    const attemptId = Object.keys(attempts).find(
      (id) => attempts[id].quizId === quizId
    );
    if (attemptId) {
      delete attempts[attemptId];
      window.localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(attempts));
    }
  },
};

