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
exports.ParentStudentRelation = void 0;
const typeorm_1 = require("typeorm");
const parent_profile_entity_1 = require("./parent-profile.entity");
const student_profile_entity_1 = require("./student-profile.entity");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
let ParentStudentRelation = class ParentStudentRelation {
};
exports.ParentStudentRelation = ParentStudentRelation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ParentStudentRelation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParentStudentRelation.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParentStudentRelation.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParentStudentRelation.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ParentStudentRelation.prototype, "notificationsEnabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ParentStudentRelation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parent_profile_entity_1.ParentProfile, (parent) => parent.parentStudentRelations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", parent_profile_entity_1.ParentProfile)
], ParentStudentRelation.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_profile_entity_1.StudentProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], ParentStudentRelation.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_profile_entity_1.TeacherProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_profile_entity_1.TeacherProfile)
], ParentStudentRelation.prototype, "teacher", void 0);
exports.ParentStudentRelation = ParentStudentRelation = __decorate([
    (0, typeorm_1.Entity)('parent_student_relations'),
    (0, typeorm_1.Unique)(['parentId', 'studentId', 'teacherId'])
], ParentStudentRelation);
//# sourceMappingURL=parent-student-relation.entity.js.map