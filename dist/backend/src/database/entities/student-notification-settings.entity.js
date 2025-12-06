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
exports.StudentNotificationSettings = void 0;
const typeorm_1 = require("typeorm");
const student_profile_entity_1 = require("./student-profile.entity");
let StudentNotificationSettings = class StudentNotificationSettings {
};
exports.StudentNotificationSettings = StudentNotificationSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentNotificationSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentNotificationSettings.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => student_profile_entity_1.StudentProfile),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], StudentNotificationSettings.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 60 }),
    __metadata("design:type", Number)
], StudentNotificationSettings.prototype, "defaultReminderMinutesBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudentNotificationSettings.prototype, "enableLessonReminders", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudentNotificationSettings.prototype, "enableLessonReports", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentNotificationSettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentNotificationSettings.prototype, "updatedAt", void 0);
exports.StudentNotificationSettings = StudentNotificationSettings = __decorate([
    (0, typeorm_1.Entity)('student_notification_settings')
], StudentNotificationSettings);
//# sourceMappingURL=student-notification-settings.entity.js.map