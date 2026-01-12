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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nanoid_1 = require("nanoid");
const telegram_service_1 = require("./telegram.service");
const entities_1 = require("../database/entities");
const utils_1 = require("../shared/utils");
function generateReferralCode(prefix) {
    return `${prefix}_${(0, nanoid_1.nanoid)(12)}`;
}
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepository, teacherProfileRepository, studentProfileRepository, parentProfileRepository, invitationRepository, teacherStudentLinkRepository, parentStudentRelationRepository, jwtService, telegramService) {
        this.userRepository = userRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.parentProfileRepository = parentProfileRepository;
        this.invitationRepository = invitationRepository;
        this.teacherStudentLinkRepository = teacherStudentLinkRepository;
        this.parentStudentRelationRepository = parentStudentRelationRepository;
        this.jwtService = jwtService;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async init(initData) {
        const telegramUser = this.telegramService.validateInitData(initData);
        if (!telegramUser) {
            this.logger.warn(`Init failed: invalid initData`);
            throw new common_1.UnauthorizedException("INVALID_INIT_DATA");
        }
        this.logger.log(`Init: tg=${telegramUser.id} @${telegramUser.username || "no_username"}`);
        const user = await this.userRepository.findOne({
            where: { telegramId: String(telegramUser.id) },
            relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
        if (!user) {
            this.logger.log(`Init: new user tg=${telegramUser.id}`);
            return {
                isNewUser: true,
                telegramUser: {
                    id: telegramUser.id,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    username: telegramUser.username,
                },
            };
        }
        const roles = this.getUserRoles(user);
        this.logger.log(`Init: existing user tg=${telegramUser.id} roles=${roles.join(",")}`);
        if (roles.length === 1) {
            const token = this.generateToken(user, roles[0]);
            return {
                isNewUser: false,
                user: this.formatUser(user),
                roles,
                currentRole: roles[0],
                token,
            };
        }
        return {
            isNewUser: false,
            user: this.formatUser(user),
            roles,
            currentRole: null,
            token: null,
        };
    }
    async register(initData, role) {
        const telegramUser = this.telegramService.validateInitData(initData);
        if (!telegramUser) {
            this.logger.warn(`Register failed: invalid initData`);
            throw new common_1.UnauthorizedException("INVALID_INIT_DATA");
        }
        const existing = await this.userRepository.findOne({
            where: { telegramId: String(telegramUser.id) },
        });
        if (existing) {
            this.logger.warn(`Register failed: user exists tg=${telegramUser.id}`);
            throw new common_1.ConflictException("USER_EXISTS");
        }
        const user = this.userRepository.create({
            telegramId: String(telegramUser.id),
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
        });
        await this.userRepository.save(user);
        const profile = await this.createProfile(user.id, role, telegramUser);
        const userWithProfile = { ...user, [`${role}Profile`]: profile };
        const token = this.generateToken(userWithProfile, role);
        this.logger.log(`Register: tg=${telegramUser.id} role=${role} userId=${user.id}`);
        return {
            user: this.formatUser(user),
            roles: [role],
            currentRole: role,
            profile: this.formatProfile(profile, role),
            token,
        };
    }
    async selectRole(initData, role) {
        const telegramUser = this.telegramService.validateInitData(initData);
        if (!telegramUser) {
            throw new common_1.UnauthorizedException("INVALID_INIT_DATA");
        }
        const user = await this.userRepository.findOne({
            where: { telegramId: String(telegramUser.id) },
            relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
        if (!user) {
            throw new common_1.UnauthorizedException("USER_NOT_FOUND");
        }
        const roles = this.getUserRoles(user);
        if (!roles.includes(role)) {
            throw new common_1.ForbiddenException("ROLE_NOT_AVAILABLE");
        }
        const token = this.generateToken(user, role);
        return {
            user: this.formatUser(user),
            roles,
            currentRole: role,
            token,
        };
    }
    async addRole(userId, role) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
        if (!user) {
            throw new common_1.UnauthorizedException("USER_NOT_FOUND");
        }
        const existingRoles = this.getUserRoles(user);
        if (existingRoles.includes(role)) {
            throw new common_1.ConflictException("ROLE_EXISTS");
        }
        const profile = await this.createProfile(userId, role, {
            id: Number(user.telegramId),
            first_name: user.firstName || undefined,
            last_name: user.lastName || undefined,
            username: user.username || undefined,
        });
        const updatedUser = { ...user, [`${role}Profile`]: profile };
        const newRoles = [...existingRoles, role];
        const token = this.generateToken(updatedUser, role);
        this.logger.log(`AddRole: userId=${userId} role=${role}`);
        return {
            user: this.formatUser(user),
            roles: newRoles,
            currentRole: role,
            token,
        };
    }
    async getMe(userId, role) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
        if (!user) {
            throw new common_1.UnauthorizedException("USER_NOT_FOUND");
        }
        const roles = this.getUserRoles(user);
        const profiles = {};
        if (user.teacherProfile) {
            profiles.teacher = {
                id: user.teacherProfile.id,
                displayName: user.teacherProfile.displayName,
                bio: user.teacherProfile.bio,
            };
        }
        if (user.studentProfile) {
            profiles.student = {
                id: user.studentProfile.id,
                customFields: user.studentProfile.customFields,
            };
        }
        if (user.parentProfile) {
            profiles.parent = {
                id: user.parentProfile.id,
            };
        }
        return {
            user: {
                ...this.formatUser(user),
                createdAt: user.createdAt.toISOString(),
            },
            roles,
            currentRole: role,
            profiles,
        };
    }
    async refresh(userId, role) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
        if (!user) {
            throw new common_1.UnauthorizedException("USER_NOT_FOUND");
        }
        const token = this.generateToken(user, role);
        const decoded = this.jwtService.decode(token);
        return {
            token,
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
        };
    }
    async setBetaTester(userId, isBetaTester, adminCode) {
        const validAdminCode = process.env.ADMIN_CODE || "admin_secret_code";
        if (adminCode !== validAdminCode) {
            this.logger.warn(`SetBetaTester failed: invalid admin code for user=${userId}`);
            throw new common_1.ForbiddenException("INVALID_ADMIN_CODE");
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("USER_NOT_FOUND");
        }
        user.isBetaTester = isBetaTester;
        await this.userRepository.save(user);
        this.logger.log(`SetBetaTester: user=${userId} isBetaTester=${isBetaTester}`);
        return {
            userId: user.id,
            isBetaTester: user.isBetaTester,
            message: isBetaTester
                ? "Бета-тестер активирован"
                : "Бета-тестер деактивирован",
        };
    }
    async activateBetaTester(userId, betaCode) {
        const validBetaCode = process.env.BETA_CODE || "beta_2025";
        if (betaCode !== validBetaCode) {
            this.logger.warn(`ActivateBetaTester failed: invalid code for user=${userId}`);
            throw new common_1.BadRequestException("INVALID_BETA_CODE");
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("USER_NOT_FOUND");
        }
        if (user.isBetaTester) {
            return {
                userId: user.id,
                isBetaTester: true,
                message: "Вы уже бета-тестер",
            };
        }
        user.isBetaTester = true;
        await this.userRepository.save(user);
        this.logger.log(`ActivateBetaTester: user=${userId} activated`);
        return {
            userId: user.id,
            isBetaTester: true,
            message: "Добро пожаловать в программу бета-тестирования!",
        };
    }
    async acceptInvitation(initData, invitationToken, userId) {
        const invitation = await this.invitationRepository.findOne({
            where: { token: invitationToken },
            relations: ["teacher", "teacher.user"],
        });
        if (!invitation) {
            throw new common_1.BadRequestException("INVALID_INVITATION");
        }
        if (invitation.usedAt) {
            throw new common_1.GoneException("INVITATION_USED");
        }
        if (new Date() > invitation.expiresAt) {
            throw new common_1.GoneException("INVITATION_EXPIRED");
        }
        let user = null;
        let telegramUser = null;
        if (userId) {
            user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ["teacherProfile", "studentProfile", "parentProfile"],
            });
        }
        else if (initData) {
            telegramUser = this.telegramService.validateInitData(initData);
            if (!telegramUser) {
                throw new common_1.UnauthorizedException("INVALID_INIT_DATA");
            }
            user = await this.userRepository.findOne({
                where: { telegramId: String(telegramUser.id) },
                relations: ["teacherProfile", "studentProfile", "parentProfile"],
            });
            if (!user) {
                const newUser = this.userRepository.create({
                    telegramId: String(telegramUser.id),
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name,
                    username: telegramUser.username,
                });
                await this.userRepository.save(newUser);
                user = await this.userRepository.findOne({
                    where: { id: newUser.id },
                    relations: ["teacherProfile", "studentProfile", "parentProfile"],
                });
            }
        }
        if (!user) {
            throw new common_1.UnauthorizedException("USER_NOT_FOUND");
        }
        const role = invitation.type;
        let profile = this.getProfile(user, role);
        if (!profile) {
            profile = await this.createProfile(user.id, role, telegramUser || {
                id: Number(user.telegramId),
                first_name: user.firstName || undefined,
                last_name: user.lastName || undefined,
                username: user.username || undefined,
            });
            user[`${role}Profile`] = profile;
        }
        if (role === "student" && profile) {
            const existingLink = await this.teacherStudentLinkRepository.findOne({
                where: { teacherId: invitation.teacherId, studentId: profile.id },
            });
            if (!existingLink) {
                const link = this.teacherStudentLinkRepository.create({
                    teacherId: invitation.teacherId,
                    studentId: profile.id,
                });
                await this.teacherStudentLinkRepository.save(link);
            }
        }
        else if (role === "parent" && invitation.studentId && profile) {
            const existingRelation = await this.parentStudentRelationRepository.findOne({
                where: {
                    parentId: profile.id,
                    studentId: invitation.studentId,
                    teacherId: invitation.teacherId,
                },
            });
            if (!existingRelation) {
                const relation = this.parentStudentRelationRepository.create({
                    parentId: profile.id,
                    studentId: invitation.studentId,
                    teacherId: invitation.teacherId,
                    notificationsEnabled: true,
                });
                await this.parentStudentRelationRepository.save(relation);
            }
        }
        invitation.usedAt = new Date();
        await this.invitationRepository.save(invitation);
        const roles = this.getUserRoles(user);
        const token = this.generateToken(user, role);
        return {
            user: this.formatUser(user),
            roles,
            currentRole: role,
            token,
            invitation: {
                type: invitation.type,
                teacher: {
                    id: invitation.teacher.id,
                    displayName: invitation.teacher.displayName,
                },
            },
        };
    }
    async joinByReferral(initData, referralCode) {
        const telegramUser = this.telegramService.validateInitData(initData);
        if (!telegramUser) {
            this.logger.warn(`Join failed: invalid initData code=${referralCode}`);
            throw new common_1.UnauthorizedException("INVALID_INIT_DATA");
        }
        this.logger.log(`Join: tg=${telegramUser.id} code=${referralCode}`);
        if (referralCode.startsWith("T_")) {
            return this.joinTeacher(telegramUser, referralCode);
        }
        else if (referralCode.startsWith("P_")) {
            return this.joinAsParent(telegramUser, referralCode);
        }
        else {
            this.logger.warn(`Join failed: invalid code format code=${referralCode}`);
            throw new common_1.BadRequestException("INVALID_REFERRAL_CODE");
        }
    }
    async joinTeacher(telegramUser, referralCode) {
        const teacher = await this.teacherProfileRepository.findOne({
            where: { referralCode },
            relations: ["user"],
        });
        if (!teacher) {
            this.logger.warn(`JoinTeacher failed: teacher not found code=${referralCode}`);
            throw new common_1.NotFoundException("TEACHER_NOT_FOUND");
        }
        let user = await this.findOrCreateUser(telegramUser);
        let studentProfile = user.studentProfile;
        if (!studentProfile) {
            studentProfile = (await this.createProfile(user.id, "student", telegramUser));
            user.studentProfile = studentProfile;
        }
        await this.ensureTeacherStudentLink(teacher.id, studentProfile.id);
        const roles = this.getUserRoles(user);
        const token = this.generateToken(user, "student");
        this.logger.log(`JoinTeacher: tg=${telegramUser.id} linked to teacher=${teacher.id}`);
        const botUsername = (0, utils_1.getBotUsername)();
        return {
            user: this.formatUser(user),
            roles,
            currentRole: "student",
            token,
            teacher: {
                id: teacher.id,
                displayName: teacher.displayName,
            },
            parentInviteCode: studentProfile.parentInviteCode,
            parentInviteUrl: (0, utils_1.generateInviteUrl)(studentProfile.parentInviteCode),
        };
    }
    async joinAsParent(telegramUser, parentInviteCode) {
        const student = await this.studentProfileRepository.findOne({
            where: { parentInviteCode },
            relations: ["user", "teacherStudentLinks", "teacherStudentLinks.teacher"],
        });
        if (!student) {
            this.logger.warn(`JoinAsParent failed: student not found code=${parentInviteCode}`);
            throw new common_1.NotFoundException("STUDENT_NOT_FOUND");
        }
        let user = await this.findOrCreateUser(telegramUser);
        let parentProfile = user.parentProfile;
        if (!parentProfile) {
            parentProfile = (await this.createProfile(user.id, "parent", telegramUser));
            user.parentProfile = parentProfile;
        }
        for (const link of student.teacherStudentLinks) {
            await this.ensureParentStudentRelation(parentProfile.id, student.id, link.teacherId);
        }
        const roles = this.getUserRoles(user);
        const token = this.generateToken(user, "parent");
        this.logger.log(`JoinAsParent: tg=${telegramUser.id} linked to student=${student.id}`);
        return {
            user: this.formatUser(user),
            roles,
            currentRole: "parent",
            token,
            student: {
                id: student.id,
                name: (0, utils_1.formatFullName)(student.user.firstName, student.user.lastName),
            },
        };
    }
    async findOrCreateUser(telegramUser) {
        let user = await this.userRepository.findOne({
            where: { telegramId: String(telegramUser.id) },
            relations: ["teacherProfile", "studentProfile", "parentProfile"],
        });
        if (!user) {
            const newUser = this.userRepository.create({
                telegramId: String(telegramUser.id),
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                username: telegramUser.username,
            });
            await this.userRepository.save(newUser);
            user = await this.userRepository.findOne({
                where: { id: newUser.id },
                relations: ["teacherProfile", "studentProfile", "parentProfile"],
            });
        }
        if (!user) {
            throw new common_1.UnauthorizedException("USER_NOT_FOUND");
        }
        return user;
    }
    async ensureTeacherStudentLink(teacherId, studentId) {
        const existingLink = await this.teacherStudentLinkRepository.findOne({
            where: { teacherId, studentId },
        });
        if (!existingLink) {
            const link = this.teacherStudentLinkRepository.create({
                teacherId,
                studentId,
            });
            await this.teacherStudentLinkRepository.save(link);
        }
    }
    async ensureParentStudentRelation(parentId, studentId, teacherId) {
        const existingRelation = await this.parentStudentRelationRepository.findOne({
            where: { parentId, studentId, teacherId },
        });
        if (!existingRelation) {
            const relation = this.parentStudentRelationRepository.create({
                parentId,
                studentId,
                teacherId,
                notificationsEnabled: true,
            });
            await this.parentStudentRelationRepository.save(relation);
        }
    }
    getUserRoles(user) {
        const roles = [];
        if (user.teacherProfile)
            roles.push("teacher");
        if (user.studentProfile)
            roles.push("student");
        if (user.parentProfile)
            roles.push("parent");
        return roles;
    }
    getProfile(user, role) {
        switch (role) {
            case "teacher":
                return user.teacherProfile;
            case "student":
                return user.studentProfile;
            case "parent":
                return user.parentProfile;
        }
    }
    async createProfile(userId, role, telegramUser) {
        switch (role) {
            case "teacher": {
                const profile = this.teacherProfileRepository.create({
                    userId,
                    displayName: (0, utils_1.formatFullName)(telegramUser.first_name, telegramUser.last_name) ||
                        "Учитель",
                    referralCode: generateReferralCode("T"),
                });
                return this.teacherProfileRepository.save(profile);
            }
            case "student": {
                const profile = this.studentProfileRepository.create({
                    userId,
                    parentInviteCode: generateReferralCode("P"),
                });
                return this.studentProfileRepository.save(profile);
            }
            case "parent": {
                const profile = this.parentProfileRepository.create({ userId });
                return this.parentProfileRepository.save(profile);
            }
        }
    }
    generateToken(user, role) {
        const profile = this.getProfile(user, role);
        const payload = {
            sub: user.id,
            telegramId: Number(user.telegramId),
            role,
            profileId: profile?.id || "",
            isBetaTester: user.isBetaTester || false,
        };
        return this.jwtService.sign(payload);
    }
    formatUser(user) {
        return {
            id: user.id,
            telegramId: Number(user.telegramId),
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            isBetaTester: user.isBetaTester || false,
        };
    }
    formatProfile(profile, role) {
        if (role === "teacher") {
            return {
                id: profile.id,
                displayName: profile.displayName,
            };
        }
        return { id: profile.id };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TeacherProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.StudentProfile)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.ParentProfile)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Invitation)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.TeacherStudentLink)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.ParentStudentRelation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        telegram_service_1.TelegramService])
], AuthService);
//# sourceMappingURL=auth.service.js.map