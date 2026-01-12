"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonSeries = void 0;
const typeorm_1 = require("typeorm");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
const subject_entity_1 = require("./subject.entity");
const lesson_entity_1 = require("./lesson.entity");
const lesson_series_student_entity_1 = require("./lesson-series-student.entity");
let LessonSeries = class LessonSeries {
};
exports.LessonSeries = LessonSeries;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LessonSeries.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonSeries.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonSeries.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonSeries.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], LessonSeries.prototype, "dayOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], LessonSeries.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], LessonSeries.prototype, "maxOccurrences", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonSeries.prototype, "timeOfDay", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LessonSeries.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LessonSeries.prototype, "priceRub", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LessonSeries.prototype, "isFree", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LessonSeries.prototype, "meetingUrl", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LessonSeries.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LessonSeries.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_profile_entity_1.TeacherProfile, (teacher) => teacher.lessonSeries, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "teacherId" }),
    __metadata("design:type", teacher_profile_entity_1.TeacherProfile)
], LessonSeries.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject, (subject) => subject.lessonSeries, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "subjectId" }),
    __metadata("design:type", subject_entity_1.Subject)
], LessonSeries.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_entity_1.Lesson, (lesson) => lesson.series),
    __metadata("design:type", Array)
], LessonSeries.prototype, "lessons", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_series_student_entity_1.LessonSeriesStudent, (ss) => ss.series),
    __metadata("design:type", Array)
], LessonSeries.prototype, "seriesStudents", void 0);
exports.LessonSeries = LessonSeries = __decorate([
    (0, typeorm_1.Entity)("lesson_series")
], LessonSeries);
//# sourceMappingURL=lesson-series.entity.js.map