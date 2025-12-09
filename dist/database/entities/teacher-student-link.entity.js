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
exports.TeacherStudentLink = void 0;
const typeorm_1 = require("typeorm");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
const student_profile_entity_1 = require("./student-profile.entity");
let TeacherStudentLink = class TeacherStudentLink {
};
exports.TeacherStudentLink = TeacherStudentLink;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherStudentLink.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherStudentLink.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherStudentLink.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TeacherStudentLink.prototype, "customFields", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherStudentLink.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeacherStudentLink.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_profile_entity_1.TeacherProfile, (teacher) => teacher.teacherStudentLinks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_profile_entity_1.TeacherProfile)
], TeacherStudentLink.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_profile_entity_1.StudentProfile, (student) => student.teacherStudentLinks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], TeacherStudentLink.prototype, "student", void 0);
exports.TeacherStudentLink = TeacherStudentLink = __decorate([
    (0, typeorm_1.Entity)('teacher_student_links'),
    (0, typeorm_1.Unique)(['teacherId', 'studentId'])
], TeacherStudentLink);
//# sourceMappingURL=teacher-student-link.entity.js.map