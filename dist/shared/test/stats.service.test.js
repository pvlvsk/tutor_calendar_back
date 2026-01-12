function calculateAttendanceFromRecords(records) {
    const total = records.length;
    const attended = records.filter((r) => r.attendance === 'attended').length;
    const missed = records.filter((r) => r.attendance === 'missed').length;
    const cancelled = records.filter((r) => r.lesson?.status === 'cancelled').length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return {
        totalLessonsPlanned: total,
        totalLessonsAttended: attended,
        totalLessonsMissed: missed,
        cancelledByStudent: cancelled,
        cancelledByTeacher: 0,
        cancelledByIllness: 0,
        attendanceRate: rate,
    };
}
function calculateStatsBySubject(records) {
    const bySubject = new Map();
    for (const r of records) {
        const subjectId = r.lesson?.subjectId;
        const subjectName = r.lesson?.subject?.name || '';
        const colorHex = r.lesson?.subject?.colorHex || '#888888';
        if (!subjectId)
            continue;
        if (!bySubject.has(subjectId)) {
            bySubject.set(subjectId, { name: subjectName, colorHex, attended: 0, total: 0 });
        }
        const stats = bySubject.get(subjectId);
        stats.total++;
        if (r.attendance === 'attended')
            stats.attended++;
    }
    return Array.from(bySubject.entries()).map(([id, s]) => ({
        subjectId: id,
        subjectName: s.name,
        colorHex: s.colorHex,
        lessonsPlanned: s.total,
        lessonsAttended: s.attended,
        attendanceRate: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    }));
}
function calculateStatsByTeacher(records) {
    const byTeacher = new Map();
    for (const r of records) {
        const teacherId = r.lesson?.teacherId;
        const teacherName = r.lesson?.teacher?.displayName || '';
        if (!teacherId)
            continue;
        if (!byTeacher.has(teacherId)) {
            byTeacher.set(teacherId, { name: teacherName, attended: 0, total: 0 });
        }
        const stats = byTeacher.get(teacherId);
        stats.total++;
        if (r.attendance === 'attended')
            stats.attended++;
    }
    return Array.from(byTeacher.entries()).map(([id, s]) => ({
        teacherId: id,
        teacherName: s.name,
        lessonsPlanned: s.total,
        lessonsAttended: s.attended,
        attendanceRate: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
    }));
}
describe('StatsService — calculateAttendanceFromRecords', () => {
    it('должен вернуть нули для пустого массива', () => {
        const result = calculateAttendanceFromRecords([]);
        expect(result.totalLessonsPlanned).toBe(0);
        expect(result.attendanceRate).toBe(0);
    });
    it('должен подсчитать посещённые уроки', () => {
        const records = [
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'missed', lesson: { status: 'done' } },
        ];
        const result = calculateAttendanceFromRecords(records);
        expect(result.totalLessonsPlanned).toBe(3);
        expect(result.totalLessonsAttended).toBe(2);
        expect(result.totalLessonsMissed).toBe(1);
    });
    it('должен вычислить процент посещаемости', () => {
        const records = [
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'missed', lesson: { status: 'done' } },
        ];
        const result = calculateAttendanceFromRecords(records);
        expect(result.attendanceRate).toBe(75);
    });
    it('должен округлять процент до целого', () => {
        const records = [
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'missed', lesson: { status: 'done' } },
        ];
        const result = calculateAttendanceFromRecords(records);
        expect(result.attendanceRate).toBe(67);
    });
    it('должен подсчитать отменённые уроки', () => {
        const records = [
            { attendance: 'attended', lesson: { status: 'done' } },
            { attendance: 'missed', lesson: { status: 'cancelled' } },
        ];
        const result = calculateAttendanceFromRecords(records);
        expect(result.cancelledByStudent).toBe(1);
    });
});
describe('StatsService — calculateStatsBySubject', () => {
    it('должен группировать по предметам', () => {
        const records = [
            {
                attendance: 'attended',
                lesson: {
                    subjectId: 'math',
                    subject: { name: 'Математика', colorHex: '#FF0000' },
                },
            },
            {
                attendance: 'attended',
                lesson: {
                    subjectId: 'math',
                    subject: { name: 'Математика', colorHex: '#FF0000' },
                },
            },
            {
                attendance: 'missed',
                lesson: {
                    subjectId: 'physics',
                    subject: { name: 'Физика', colorHex: '#00FF00' },
                },
            },
        ];
        const result = calculateStatsBySubject(records);
        expect(result).toHaveLength(2);
        const math = result.find((s) => s.subjectId === 'math');
        expect(math?.lessonsAttended).toBe(2);
        expect(math?.attendanceRate).toBe(100);
        const physics = result.find((s) => s.subjectId === 'physics');
        expect(physics?.lessonsAttended).toBe(0);
        expect(physics?.attendanceRate).toBe(0);
    });
    it('должен вернуть пустой массив для пустых данных', () => {
        const result = calculateStatsBySubject([]);
        expect(result).toEqual([]);
    });
});
describe('StatsService — calculateStatsByTeacher', () => {
    it('должен группировать по учителям', () => {
        const records = [
            {
                attendance: 'attended',
                lesson: { teacherId: 't1', teacher: { displayName: 'Иванов' } },
            },
            {
                attendance: 'attended',
                lesson: { teacherId: 't1', teacher: { displayName: 'Иванов' } },
            },
            {
                attendance: 'missed',
                lesson: { teacherId: 't2', teacher: { displayName: 'Петров' } },
            },
        ];
        const result = calculateStatsByTeacher(records);
        expect(result).toHaveLength(2);
        const t1 = result.find((s) => s.teacherId === 't1');
        expect(t1?.teacherName).toBe('Иванов');
        expect(t1?.lessonsAttended).toBe(2);
        const t2 = result.find((s) => s.teacherId === 't2');
        expect(t2?.teacherName).toBe('Петров');
        expect(t2?.lessonsAttended).toBe(0);
    });
});
//# sourceMappingURL=stats.service.test.js.map