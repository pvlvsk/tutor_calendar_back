import type { DayOfWeek } from '../types'

export const REMINDER_OPTIONS = [15, 30, 60, 120, 1440] as const

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export const DAYS_OF_WEEK_RU: Record<DayOfWeek, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье'
}

export const DAYS_OF_WEEK_SHORT_RU: Record<DayOfWeek, string> = {
  monday: 'Пн',
  tuesday: 'Вт',
  wednesday: 'Ср',
  thursday: 'Чт',
  friday: 'Пт',
  saturday: 'Сб',
  sunday: 'Вс'
}

export const LESSON_STATUS_RU = {
  planned: 'Запланирован',
  done: 'Проведён',
  cancelled: 'Отменён'
} as const

export const ATTENDANCE_STATUS_RU = {
  attended: 'Присутствовал',
  missed: 'Пропустил',
  unknown: 'Неизвестно'
} as const

export const DEFAULT_LESSON_DURATION = 60
export const DEFAULT_LESSON_PRICE = 1500
export const DEFAULT_REMINDER_MINUTES = 15

