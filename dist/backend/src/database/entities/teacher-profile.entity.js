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
exports.TeacherProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const subject_entity_1 = require("./subject.entity");
const teacher_student_link_entity_1 = require("./teacher-student-link.entity");
const lesson_entity_1 = require("./lesson.entity");
const lesson_series_entity_1 = require("./lesson-series.entity");
const invitation_entity_1 = require("./invitation.entity");
let TeacherProfile = class TeacherProfile {
};
exports.TeacherProfile = TeacherProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherProfile.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "referralCode", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.teacherProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], TeacherProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subject_entity_1.Subject, (subject) => subject.teacher),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "subjects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => teacher_student_link_entity_1.TeacherStudentLink, (link) => link.teacher),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "teacherStudentLinks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_entity_1.Lesson, (lesson) => lesson.teacher),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "lessons", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => lesson_series_entity_1.LessonSeries, (series) => series.teacher),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "lessonSeries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => invitation_entity_1.Invitation, (invitation) => invitation.teacher),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "invitations", void 0);
exports.TeacherProfile = TeacherProfile = __decorate([
    (0, typeorm_1.Entity)('teacher_profiles')
], TeacherProfile);
//# sourceMappingURL=teacher-profile.entity.js.map