"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAttendanceRate = calculateAttendanceRate;
exports.calculateAttendanceStats = calculateAttendanceStats;
exports.calculateStatsBySubject = calculateStatsBySubject;
exports.calculateStatsByTeacher = calculateStatsByTeacher;
exports.calculateDebtInfo = calculateDebtInfo;
exports.getDayOfWeekRu = getDayOfWeekRu;
exports.getBotUsername = getBotUsername;
exports.generateInviteUrl = generateInviteUrl;
exports.generateFallbackUrl = generateFallbackUrl;
exports.formatFullName = formatFullName;
function calculateAttendanceRate(attended, total) {
    if (total === 0)
        return 0;
    return Math.round((attended / total) * 1000) / 10;
}
function calculateAttendanceStats(lessons) {
    const now = new Date();
    const pastLessons = lessons.filter(l => new Date(l.startAt) < now);
    const done = pastLessons.filter(l => l.status === 'done');
    const attended = done.filter(l => l.attendance === 'attended').length;
    const missed = done.filter(l => l.attendance === 'missed').length;
    const doneTotal = done.length;
    const cancelled = pastLessons.filter(l => l.status === 'cancelled');
    const cancelledByStudentOnly = cancelled.filter(l => l.cancelledBy === 'student' && l.cancellationReason !== 'illness').length;
    const cancelledByTeacher = cancelled.filter(l => l.cancelledBy === 'teacher').length;
    const cancelledByIllness = cancelled.filter(l => l.cancelledBy === 'student' && l.cancellationReason === 'illness').length;
    const pastPlanned = pastLessons.filter(l => l.status === 'planned').length;
    const totalCancelledByStudent = cancelledByStudentOnly + cancelledByIllness;
    const totalPlanned = doneTotal + totalCancelledByStudent + cancelledByTeacher + pastPlanned;
    return {
        totalLessonsPlanned: totalPlanned,
        totalLessonsAttended: attended,
        totalLessonsMissed: missed,
        cancelledByStudent: totalCancelledByStudent,
        cancelledByTeacher,
        cancelledByIllness,
        attendanceRate: calculateAttendanceRate(attended, totalPlanned),
    };
}
function calculateStatsBySubject(lessons) {
    const now = new Date();
    const pastLessons = lessons.filter(l => new Date(l.startAt) < now);
    const doneLessons = pastLessons.filter(l => l.status === 'done');
    const cancelledByStudentLessons = pastLessons.filter(l => l.status === 'cancelled' && l.cancelledBy === 'student');
    const bySubject = new Map();
    const getOrCreate = (lesson) => {
        if (!bySubject.has(lesson.subjectId)) {
            bySubject.set(lesson.subjectId, {
                subjectId: lesson.subjectId,
                subjectName: lesson.subject?.name || '',
                colorHex: lesson.subject?.colorHex || '#888888',
                total: 0,
                attended: 0,
                missed: 0,
                cancelledByStudent: 0,
                missedLessons: [],
                cancelledLessons: [],
                teacher: lesson.teacher ? {
                    teacherId: lesson.teacherId,
                    firstName: lesson.teacher.user?.firstName,
                    lastName: lesson.teacher.user?.lastName,
                    username: lesson.teacher.user?.username,
                } : undefined,
            });
        }
        return bySubject.get(lesson.subjectId);
    };
    for (const lesson of doneLessons) {
        const stat = getOrCreate(lesson);
        stat.total++;
        if (lesson.attendance === 'attended') {
            stat.attended++;
        }
        else if (lesson.attendance === 'missed') {
            stat.missed++;
            stat.missedLessons.push({
                lessonId: lesson.id,
                startAt: lesson.startAt.toISOString(),
                subjectName: lesson.subject?.name || '',
            });
        }
    }
    for (const lesson of cancelledByStudentLessons) {
        const stat = getOrCreate(lesson);
        stat.cancelledByStudent++;
        stat.cancelledLessons.push({
            lessonId: lesson.id,
            startAt: lesson.startAt.toISOString(),
            subjectName: lesson.subject?.name || '',
        });
    }
    return Array.from(bySubject.values()).map(s => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        colorHex: s.colorHex,
        lessonsPlanned: s.total,
        lessonsAttended: s.attended,
        lessonsMissed: s.missed,
        cancelledByStudent: s.cancelledByStudent,
        attendanceRate: calculateAttendanceRate(s.attended, s.total),
        missedLessons: s.missedLessons,
        cancelledLessons: s.cancelledLessons,
        teacher: s.teacher,
    }));
}
function calculateStatsByTeacher(lessons) {
    const now = new Date();
    const pastLessons = lessons.filter(l => new Date(l.startAt) < now);
    const byTeacher = new Map();
    for (const lesson of pastLessons) {
        if (!byTeacher.has(lesson.teacherId)) {
            byTeacher.set(lesson.teacherId, {
                teacherId: lesson.teacherId,
                teacherName: lesson.teacher?.displayName || '',
                total: 0,
                attended: 0,
            });
        }
        const stat = byTeacher.get(lesson.teacherId);
        stat.total++;
        if (lesson.status === 'done' && lesson.attendance === 'attended') {
            stat.attended++;
        }
    }
    return Array.from(byTeacher.values()).map(t => ({
        teacherId: t.teacherId,
        teacherName: t.teacherName,
        lessonsPlanned: t.total,
        lessonsAttended: t.attended,
        attendanceRate: calculateAttendanceRate(t.attended, t.total),
    }));
}
function calculateDebtInfo(unpaidLessons) {
    return {
        hasDebt: unpaidLessons.length > 0,
        unpaidLessonsCount: unpaidLessons.length,
        unpaidAmountRub: unpaidLessons.reduce((sum, l) => sum + l.priceRub, 0),
    };
}
function getDayOfWeekRu(date) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
}
function getBotUsername() {
    return process.env.BOT_USERNAME || 'your_bot';
}
function generateInviteUrl(code) {
    const bot = getBotUsername();
    return `https://t.me/${bot}/app?startapp=${code}`;
}
function generateFallbackUrl(code) {
    const bot = getBotUsername();
    return `https://t.me/${bot}?start=${code}`;
}
function formatFullName(firstName, lastName) {
    return [firstName, lastName].filter(Boolean).join(' ') || '';
}
//# sourceMappingURL=utils.js.map