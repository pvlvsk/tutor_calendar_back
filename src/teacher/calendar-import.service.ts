import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import * as ical from "node-ical";
import {
  Lesson,
  Subject,
  LessonStudent,
  TeacherStudentLink,
  LessonSeries,
  LessonSeriesStudent,
} from "../database/entities";

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  isRecurring?: boolean;
  originalUid?: string;
}

export interface ImportPreviewEvent {
  uid: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  location?: string;
  suggestedSubjectId?: string;
  suggestedSubjectName?: string;
  isRecurring?: boolean;
  originalUid?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  seriesCreated: number;
}

@Injectable()
export class CalendarImportService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepo: Repository<Lesson>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(LessonStudent)
    private lessonStudentRepo: Repository<LessonStudent>,
    @InjectRepository(TeacherStudentLink)
    private linkRepo: Repository<TeacherStudentLink>,
    @InjectRepository(LessonSeries)
    private seriesRepo: Repository<LessonSeries>,
    @InjectRepository(LessonSeriesStudent)
    private seriesStudentRepo: Repository<LessonSeriesStudent>
  ) {}

  /**
   * Загружает и парсит ICS календарь по URL
   * @deprecated Используй parseIcsData напрямую с ical.async.fromURL
   */
  async fetchCalendar(url: string, expandUntil?: Date): Promise<IcsEvent[]> {
    try {
      const data = await ical.async.fromURL(url);
      return this.parseIcsData(data, expandUntil);
    } catch (error) {
      throw new BadRequestException(
        `Не удалось загрузить календарь: ${error.message}`
      );
    }
  }

  /**
   * Парсит ICS календарь из содержимого файла
   * @deprecated Используй parseIcsData напрямую с ical.sync.parseICS
   */
  parseCalendarContent(content: string, expandUntil?: Date): IcsEvent[] {
    try {
      const data = ical.sync.parseICS(content);
      return this.parseIcsData(data, expandUntil);
    } catch (error) {
      throw new BadRequestException(
        `Не удалось разобрать файл календаря: ${error.message}`
      );
    }
  }

  /**
   * Парсит ICS данные в массив событий
   * Разворачивает повторяющиеся события (RRULE) в отдельные вхождения
   */
  private parseIcsData(data: ical.CalendarResponse, expandUntil?: Date): IcsEvent[] {
    const events: IcsEvent[] = [];
    
    // По умолчанию: разворачиваем повторяющиеся события на год вперёд
    const expandEnd = expandUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const expandStart = new Date(); // Начинаем с сегодняшнего дня

    console.log('[parseIcsData] expandStart:', expandStart.toISOString(), 'expandEnd:', expandEnd.toISOString());

    for (const key in data) {
      const event = data[key] as any;
      if (event.type !== "VEVENT") continue;

      // Пропускаем события без дат
      if (!event.start || !event.end) continue;

      const originalUid = event.uid || key;
      const summary = event.summary || "Без названия";
      const description = event.description;
      const location = event.location;
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const duration = endDate.getTime() - startDate.getTime();

      // Проверяем, является ли событие повторяющимся
      if (event.rrule) {
        try {
          // RRuleCompatWrapper из node-ical имеет метод .between()
          const occurrences = event.rrule.between(expandStart, expandEnd, true);
          
          console.log(`[parseIcsData] Повторяющееся событие "${summary}": ${occurrences.length} вхождений`);
          
          // Ограничиваем разумным количеством
          const limitedOccurrences = occurrences.slice(0, 100);
          
          for (const occurrenceDate of limitedOccurrences) {
            const occurrenceStart = new Date(occurrenceDate);
            const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
            const occurrenceUid = `${originalUid}_${occurrenceStart.toISOString()}`;
            
            events.push({
              uid: occurrenceUid,
              summary,
              description,
              start: occurrenceStart,
              end: occurrenceEnd,
              location,
              isRecurring: true,
              originalUid,
            });
          }
        } catch (error) {
          console.error(`[parseIcsData] Ошибка разворачивания RRULE для "${summary}":`, error);
          // Запасной вариант: добавляем одиночное событие
          events.push({
            uid: originalUid,
            summary,
            description,
            start: startDate,
            end: endDate,
            location,
            isRecurring: true,
            originalUid,
          });
        }
      } else {
        // Одиночное событие
        events.push({
          uid: originalUid,
          summary,
          description,
          start: startDate,
          end: endDate,
          location,
          isRecurring: false,
        });
      }
    }

    // Сортируем по дате начала
    events.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    console.log(`[parseIcsData] Всего событий после разворачивания: ${events.length}`);

    return events;
  }

  /**
   * Получает превью событий с предложениями предметов
   * Повторяющиеся события разворачиваются в отдельные вхождения
   */
  async getImportPreview(
    teacherId: string,
    source: { url?: string; content?: string },
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    events: ImportPreviewEvent[];
    subjects: { id: string; name: string }[];
    totalEvents: number;
    hasRecurringEvents: boolean;
  }> {
    // Диапазон дат по умолчанию: от сегодня до года вперёд
    const defaultFrom = fromDate || new Date();
    const defaultTo = toDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    let icsEvents: IcsEvent[];
    
    if (source.url) {
      const data = await ical.async.fromURL(source.url);
      icsEvents = this.parseIcsData(data, defaultTo);
    } else if (source.content) {
      const data = ical.sync.parseICS(source.content);
      icsEvents = this.parseIcsData(data, defaultTo);
    } else {
      throw new BadRequestException("Укажите URL или содержимое файла");
    }

    // Проверяем, есть ли повторяющиеся события
    const hasRecurringEvents = icsEvents.some((e) => e.isRecurring);

    // Фильтруем по диапазону дат
    let filteredEvents = icsEvents.filter(
      (e) => e.start >= defaultFrom && e.start <= defaultTo
    );

    // Получаем предметы учителя для предложений
    const subjects = await this.subjectRepo.find({
      where: { teacherId },
      select: ["id", "name"],
    });

    // Маппим события с предложениями предметов
    const events: ImportPreviewEvent[] = filteredEvents.map((event) => {
      const durationMinutes = Math.round(
        (event.end.getTime() - event.start.getTime()) / (1000 * 60)
      );

      // Пытаемся найти подходящий предмет по названию события
      const matchedSubject = this.findMatchingSubject(event.summary, subjects);

      return {
        uid: event.uid,
        title: event.summary,
        description: event.description,
        startAt: event.start,
        endAt: event.end,
        durationMinutes,
        location: event.location,
        suggestedSubjectId: matchedSubject?.id,
        suggestedSubjectName: matchedSubject?.name,
        isRecurring: event.isRecurring,
        originalUid: event.originalUid,
      };
    });

    return {
      events,
      subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
      totalEvents: icsEvents.length,
      hasRecurringEvents,
    };
  }

  /**
   * Импортирует события как уроки
   * Повторяющиеся события группируются в серии (LessonSeries)
   */
  async importEvents(
    teacherId: string,
    eventsToImport: {
      uid: string;
      subjectId?: string | null;
      autoCreateSubject?: boolean;
      studentIds?: string[];
      priceRub?: number;
    }[],
    source: { url?: string; content?: string }
  ): Promise<ImportResult> {
    const expandUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    let icsEvents: IcsEvent[];
    
    if (source.url) {
      const data = await ical.async.fromURL(source.url);
      icsEvents = this.parseIcsData(data, expandUntil);
    } else if (source.content) {
      const data = ical.sync.parseICS(source.content);
      icsEvents = this.parseIcsData(data, expandUntil);
    } else {
      throw new BadRequestException("Укажите URL или содержимое файла");
    }
    
    const icsMap = new Map(icsEvents.map((e) => [e.uid, e]));

    // Валидируем предметы
    const subjectIds = [
      ...new Set(eventsToImport.map((e) => e.subjectId).filter(Boolean)),
    ] as string[];
    const existingSubjects =
      subjectIds.length > 0
        ? await this.subjectRepo.find({
            where: { id: In(subjectIds), teacherId },
          })
        : [];
    const validSubjectIds = new Set(existingSubjects.map((s) => s.id));

    // Получаем все предметы учителя для автосоздания
    const allTeacherSubjects = await this.subjectRepo.find({
      where: { teacherId },
      select: ["id", "name"],
    });
    const subjectsByName = new Map(
      allTeacherSubjects.map((s) => [s.name.toLowerCase(), s])
    );
    const autoCreatedSubjects = new Map<string, string>();

    // Получаем учеников учителя
    const studentLinks = await this.linkRepo.find({
      where: { teacherId },
      select: ["studentId"],
    });
    const validStudentIds = new Set(studentLinks.map((l) => l.studentId));

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
      seriesCreated: 0,
    };

    const generateColor = () => {
      const colors = [
        "#2563EB", "#7C3AED", "#DB2777", "#DC2626", 
        "#EA580C", "#CA8A04", "#16A34A", "#0891B2"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Вспомогательная функция для определения subjectId
    const resolveSubjectId = async (
      eventData: typeof eventsToImport[0],
      icsEvent: IcsEvent
    ): Promise<string | null> => {
      let subjectId: string | null = eventData.subjectId || null;

      if (!subjectId && eventData.autoCreateSubject && icsEvent.summary) {
        const titleLower = icsEvent.summary.toLowerCase();
        
        if (autoCreatedSubjects.has(titleLower)) {
          subjectId = autoCreatedSubjects.get(titleLower)!;
        } else if (subjectsByName.has(titleLower)) {
          subjectId = subjectsByName.get(titleLower)!.id;
          autoCreatedSubjects.set(titleLower, subjectId);
        } else {
          const code = icsEvent.summary
            .substring(0, 3)
            .toUpperCase()
            .replace(/[^A-ZА-Я0-9]/gi, "") || "IMP";
          
          const newSubject = await this.subjectRepo.save(
            this.subjectRepo.create({
              teacherId,
              name: icsEvent.summary,
              code,
              colorHex: generateColor(),
            })
          );
          subjectId = newSubject.id;
          autoCreatedSubjects.set(titleLower, subjectId);
          subjectsByName.set(titleLower, newSubject);
          console.log(`[Import] Создан предмет "${icsEvent.summary}" (${subjectId})`);
        }
      }

      if (eventData.subjectId && !validSubjectIds.has(eventData.subjectId)) {
        return null;
      }

      return subjectId;
    };

    // Группируем события по originalUid (для повторяющихся) или как одиночные
    const eventsByOriginalUid = new Map<string, {
      eventData: typeof eventsToImport[0];
      icsEvent: IcsEvent;
    }[]>();

    for (const eventData of eventsToImport) {
      const icsEvent = icsMap.get(eventData.uid);
      if (!icsEvent) {
        result.errors.push(`Событие ${eventData.uid} не найдено`);
        result.skipped++;
        continue;
      }

      // Группируем по originalUid для повторяющихся, или по uid для одиночных
      const groupKey = icsEvent.isRecurring && icsEvent.originalUid 
        ? icsEvent.originalUid 
        : icsEvent.uid;

      if (!eventsByOriginalUid.has(groupKey)) {
        eventsByOriginalUid.set(groupKey, []);
      }
      eventsByOriginalUid.get(groupKey)!.push({ eventData, icsEvent });
    }

    // Обрабатываем каждую группу
    for (const [groupKey, group] of eventsByOriginalUid) {
      const firstEvent = group[0];
      const isRecurringSeries = group.length > 1 || firstEvent.icsEvent.isRecurring;

      const subjectId = await resolveSubjectId(firstEvent.eventData, firstEvent.icsEvent);
      if (subjectId === null && firstEvent.eventData.subjectId) {
        result.errors.push(`Предмет не найден для "${firstEvent.icsEvent.summary}"`);
        result.skipped += group.length;
        continue;
      }

      const durationMinutes = Math.round(
        (firstEvent.icsEvent.end.getTime() - firstEvent.icsEvent.start.getTime()) / (1000 * 60)
      );
      const priceRub = firstEvent.eventData.priceRub ?? 0;
      const studentIds = (firstEvent.eventData.studentIds || []).filter((id) =>
        validStudentIds.has(id)
      );
      const meetingUrl = firstEvent.icsEvent.location?.startsWith("http")
        ? firstEvent.icsEvent.location
        : undefined;
      const description = firstEvent.icsEvent.description || undefined;

      // Сортируем группу по дате
      group.sort((a, b) => a.icsEvent.start.getTime() - b.icsEvent.start.getTime());

      let seriesId: string | undefined;

      // Создаём серию для повторяющихся событий с несколькими вхождениями
      if (isRecurringSeries && group.length > 1) {
        const firstStart = group[0].icsEvent.start;
        const lastStart = group[group.length - 1].icsEvent.start;
        const dayOfWeek = firstStart.getDay();
        const timeOfDay = firstStart.toTimeString().slice(0, 5);

        const series = this.seriesRepo.create({
          teacherId,
          subjectId,
          frequency: "weekly", // Предполагаем еженедельное повторение
          dayOfWeek,
          timeOfDay,
          durationMinutes,
          priceRub,
          isFree: priceRub === 0,
          meetingUrl,
          maxOccurrences: group.length,
          endDate: lastStart,
        });
        const savedSeries = await this.seriesRepo.save(series);
        seriesId = savedSeries.id;

        // Добавляем учеников в серию
        for (const studentId of studentIds) {
          await this.seriesStudentRepo.save(
            this.seriesStudentRepo.create({
              seriesId: savedSeries.id,
              studentId,
              priceRub,
            })
          );
        }

        result.seriesCreated++;
        console.log(`[Import] Создана серия "${firstEvent.icsEvent.summary}" с ${group.length} уроками`);
      }

      // Создаём уроки
      for (const { icsEvent } of group) {
        const lessonData: Partial<Lesson> = {
          teacherId,
          subjectId,
          seriesId,
          startAt: icsEvent.start,
          durationMinutes,
          priceRub,
          status: "planned",
          teacherNote: description,
          meetingUrl,
        };

        const savedLesson = await this.lessonRepo.save(
          this.lessonRepo.create(lessonData)
        );

        // Добавляем учеников к уроку
        for (const studentId of studentIds) {
          await this.lessonStudentRepo.save(
            this.lessonStudentRepo.create({
              lessonId: savedLesson.id,
              studentId,
              priceRub,
              paymentStatus: "unpaid",
              paymentType: priceRub ? "fixed" : "free",
            })
          );
        }

        result.imported++;
      }
    }

    return result;
  }

  /**
   * Экспортирует уроки учителя в формате ICS
   */
  async exportCalendar(
    teacherId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<string> {
    // По умолчанию: от сегодня, 3 месяца вперёд
    const from = fromDate || new Date();
    const to =
      toDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const lessons = await this.lessonRepo
      .createQueryBuilder("lesson")
      .leftJoinAndSelect("lesson.subject", "subject")
      .leftJoinAndSelect("lesson.lessonStudents", "ls")
      .leftJoinAndSelect("ls.student", "student")
      .leftJoinAndSelect("student.user", "studentUser")
      .where("lesson.teacherId = :teacherId", { teacherId })
      .andWhere("lesson.startAt >= :from", { from })
      .andWhere("lesson.startAt <= :to", { to })
      .andWhere("lesson.status != :cancelled", { cancelled: "cancelled" })
      .orderBy("lesson.startAt", "ASC")
      .getMany();

    // Генерируем ICS контент
    const icsLines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Teach Mini App//Calendar Export//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Мои уроки",
    ];

    for (const lesson of lessons) {
      const endAt = new Date(
        lesson.startAt.getTime() + lesson.durationMinutes * 60 * 1000
      );

      // Формируем имена учеников для описания
      const studentNames = lesson.lessonStudents
        ?.map((ls) => {
          const user = ls.student?.user;
          if (!user) return null;
          return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
        })
        .filter(Boolean)
        .join(", ");

      const description = [
        studentNames ? `Ученики: ${studentNames}` : null,
        lesson.teacherNote,
      ]
        .filter(Boolean)
        .join("\\n");

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:${lesson.id}@teach-mini-app`,
        `DTSTAMP:${this.formatIcsDate(new Date())}`,
        `DTSTART:${this.formatIcsDate(lesson.startAt)}`,
        `DTEND:${this.formatIcsDate(endAt)}`,
        `SUMMARY:${this.escapeIcsText(lesson.subject?.name || "Урок")}`,
        description ? `DESCRIPTION:${this.escapeIcsText(description)}` : "",
        lesson.meetingUrl ? `LOCATION:${this.escapeIcsText(lesson.meetingUrl)}` : "",
        "END:VEVENT"
      );
    }

    icsLines.push("END:VCALENDAR");

    return icsLines.filter(Boolean).join("\r\n");
  }

  /**
   * Форматирует дату для ICS (UTC)
   */
  private formatIcsDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  }

  /**
   * Экранирует текст для формата ICS
   */
  private escapeIcsText(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  /**
   * Пытается найти подходящий предмет по названию события
   */
  private findMatchingSubject(
    title: string,
    subjects: { id: string; name: string }[]
  ): { id: string; name: string } | null {
    const titleLower = title.toLowerCase();

    for (const subject of subjects) {
      const subjectLower = subject.name.toLowerCase();
      if (
        titleLower.includes(subjectLower) ||
        subjectLower.includes(titleLower)
      ) {
        return subject;
      }
    }

    return null;
  }
}
