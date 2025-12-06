// Базовая статистика посещаемости
export interface AttendanceStats {
  totalLessonsPlanned: number
  totalLessonsAttended: number
  totalLessonsMissed: number
  cancelledByStudent: number
  cancelledByTeacher: number
  cancelledByIllness: number
  attendanceRate: number
}

// Детали урока для списка
export interface LessonDetail {
  lessonId: string
  startAt: string
  subjectName: string
}

// Статистика по предмету
export interface SubjectStats {
  subjectId: string
  subjectName: string
  colorHex: string
  lessonsPlanned: number
  lessonsAttended: number
  lessonsMissed: number
  cancelledByStudent: number
  attendanceRate: number
  // Списки уроков для отображения
  missedLessons?: LessonDetail[]
  cancelledLessons?: LessonDetail[]
  // Информация об учителе (для родителей)
  teacher?: {
    teacherId: string
    firstName?: string
    lastName?: string
    username?: string
  }
}

// Информация о долге
export interface DebtInfo {
  hasDebt: boolean
  unpaidLessonsCount: number
  unpaidAmountRub: number
  description?: string
}

// Детальный долг с уроками
export interface DetailedDebt extends DebtInfo {
  lessons: Array<{
    lessonId: string
    startAt: string
    priceRub: number
    subjectName: string
  }>
}

// Краткая статистика ученика для карточки (для учителя)
export interface StudentCardStats {
  debt: DebtInfo
  nextLesson: {
    date: string
    dayOfWeek: string
    subjectName: string
  } | null
}

// Детальная статистика ученика (для учителя)
export interface StudentDetailedStatsForTeacher {
  debt: DetailedDebt
  attendance: AttendanceStats
  bySubject: SubjectStats[]
  recentMissedLessons: Array<{
    lessonId: string
    startAt: string
    subjectName: string
    reason?: string
  }>
}

// Достижение
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string | null
  progress?: number
  target?: number
}

// Геймифицированная статистика ученика
export interface StudentGamifiedStats {
  total: AttendanceStats
  bySubject: SubjectStats[]
  streak: {
    current: number
    max: number
  }
  achievements: Achievement[]
}

// Детальная статистика ученика
export interface StudentStatsDetailed {
  total: AttendanceStats
  bySubject: SubjectStats[]
  byTeacher?: Array<{
    teacherId: string
    teacherName: string
    lessonsPlanned: number
    lessonsAttended: number
    attendanceRate: number
  }>
  currentStreak: number
  maxStreak: number
}

