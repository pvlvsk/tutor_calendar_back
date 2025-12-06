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
exports.Subject = void 0;
const typeorm_1 = require("typeorm");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
const lesson_entity_1 = require("./lesson.entity");
const lesson_series_entity_1 = require("./lesson-series.entity");
let Subject = class Subject {
};
exports.Subject = Subject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Subject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subject.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subject.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subject.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subject.prototype, "colorHex", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Subject.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Subject.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_profile_entity_1.TeacherProfile, (teacher) => teacher.subjects, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_profile_entity_1.TeacherProfile)
], Subject.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_entity_1.Lesson, (lesson) => lesson.subject),
    __metadata("design:type", Array)
], Subject.prototype, "lessons", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_series_entity_1.LessonSeries, (series) => series.subject),
    __metadata("design:type", Array)
], Subject.prototype, "lessonSeries", void 0);
exports.Subject = Subject = __decorate([
    (0, typeorm_1.Entity)('subjects'),
    (0, typeorm_1.Unique)(['teacherId', 'code'])
], Subject);
//# sourceMappingURL=subject.entity.js.map