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
exports.LessonStudent = void 0;
const typeorm_1 = require("typeorm");
const lesson_entity_1 = require("./lesson.entity");
const student_profile_entity_1 = require("./student-profile.entity");
let LessonStudent = class LessonStudent {
};
exports.LessonStudent = LessonStudent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LessonStudent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonStudent.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LessonStudent.prototype, "priceRub", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "unknown" }),
    __metadata("design:type", String)
], LessonStudent.prototype, "attendance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], LessonStudent.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "unpaid" }),
    __metadata("design:type", String)
], LessonStudent.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "fixed" }),
    __metadata("design:type", String)
], LessonStudent.prototype, "paymentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LessonStudent.prototype, "paidFromSubscription", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LessonStudent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LessonStudent.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lesson_entity_1.Lesson, (lesson) => lesson.lessonStudents, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "lessonId" }),
    __metadata("design:type", lesson_entity_1.Lesson)
], LessonStudent.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_profile_entity_1.StudentProfile, (student) => student.lessonStudents, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "studentId" }),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], LessonStudent.prototype, "student", void 0);
exports.LessonStudent = LessonStudent = __decorate([
    (0, typeorm_1.Entity)("lesson_students"),
    (0, typeorm_1.Unique)(["lessonId", "studentId"])
], LessonStudent);
//# sourceMappingURL=lesson-student.entity.js.map