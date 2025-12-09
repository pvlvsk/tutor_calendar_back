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
exports.StudentProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const teacher_student_link_entity_1 = require("./teacher-student-link.entity");
const lesson_student_entity_1 = require("./lesson-student.entity");
const lesson_series_student_entity_1 = require("./lesson-series-student.entity");
let StudentProfile = class StudentProfile {
};
exports.StudentProfile = StudentProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "parentInviteCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "customFields", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentProfile.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.studentProfile, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", user_entity_1.User)
], StudentProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => teacher_student_link_entity_1.TeacherStudentLink, (link) => link.student),
    __metadata("design:type", Array)
], StudentProfile.prototype, "teacherStudentLinks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_student_entity_1.LessonStudent, (ls) => ls.student),
    __metadata("design:type", Array)
], StudentProfile.prototype, "lessonStudents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_series_student_entity_1.LessonSeriesStudent, (ss) => ss.student),
    __metadata("design:type", Array)
], StudentProfile.prototype, "seriesStudents", void 0);
exports.StudentProfile = StudentProfile = __decorate([
    (0, typeorm_1.Entity)("student_profiles")
], StudentProfile);
//# sourceMappingURL=student-profile.entity.js.map