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
exports.LessonSeriesStudent = void 0;
const typeorm_1 = require("typeorm");
const lesson_series_entity_1 = require("./lesson-series.entity");
const student_profile_entity_1 = require("./student-profile.entity");
let LessonSeriesStudent = class LessonSeriesStudent {
};
exports.LessonSeriesStudent = LessonSeriesStudent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], LessonSeriesStudent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonSeriesStudent.prototype, "seriesId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LessonSeriesStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LessonSeriesStudent.prototype, "priceRub", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LessonSeriesStudent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lesson_series_entity_1.LessonSeries, (series) => series.seriesStudents, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "seriesId" }),
    __metadata("design:type", lesson_series_entity_1.LessonSeries)
], LessonSeriesStudent.prototype, "series", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_profile_entity_1.StudentProfile, (student) => student.seriesStudents, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "studentId" }),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], LessonSeriesStudent.prototype, "student", void 0);
exports.LessonSeriesStudent = LessonSeriesStudent = __decorate([
    (0, typeorm_1.Entity)("lesson_series_students"),
    (0, typeorm_1.Unique)(["seriesId", "studentId"])
], LessonSeriesStudent);
//# sourceMappingURL=lesson-series-student.entity.js.map