"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const teacher_controller_1 = require("./teacher.controller");
const teacher_service_1 = require("./teacher.service");
const entities_1 = require("../database/entities");
let TeacherModule = class TeacherModule {
};
exports.TeacherModule = TeacherModule;
exports.TeacherModule = TeacherModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.TeacherProfile,
                entities_1.StudentProfile,
                entities_1.Subject,
                entities_1.TeacherStudentLink,
                entities_1.Lesson,
                entities_1.LessonSeries,
                entities_1.Invitation,
                entities_1.ParentStudentRelation,
            ]),
        ],
        controllers: [teacher_controller_1.TeacherController],
        providers: [teacher_service_1.TeacherService],
    })
], TeacherModule);
//# sourceMappingURL=teacher.module.js.map