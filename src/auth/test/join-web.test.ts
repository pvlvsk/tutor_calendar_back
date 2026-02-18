/**
 * @file join-web.test.ts
 * @description Unit-тесты для joinByReferralWeb
 * @relatedTo src/auth/auth.service.ts
 *
 * Покрывает:
 * - joinByReferralWeb: маршрутизация по T_/P_ кодам, невалидный формат
 * - linkStudentToTeacher (через joinByReferralWeb): создание связи, повторная связь
 * - linkParentToStudent (через joinByReferralWeb): создание связи
 */

import { BadRequestException, NotFoundException } from "@nestjs/common";

const mockTeacherProfile = {
  id: "teacher-profile-1",
  displayName: "Иван Петров",
  referralCode: "T_abc123",
  user: { telegramId: "111", firstName: "Иван", lastName: "Петров" },
};

const mockStudentProfile = {
  id: "student-profile-1",
  parentInviteCode: "P_xyz789",
  user: { firstName: "Мария", lastName: "Сидорова" },
  teacherStudentLinks: [{ teacherId: "teacher-profile-1" }],
};

function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-web-1",
    firstName: "Алексей",
    lastName: "Иванов",
    telegramId: null,
    maxId: null,
    email: "alex@test.com",
    emailVerified: true,
    isBetaTester: false,
    teacherProfile: null,
    studentProfile: null,
    parentProfile: null,
    ...overrides,
  };
}

const mockUserRepo = { findOne: jest.fn() };
const mockTeacherProfileRepo = { findOne: jest.fn() };
const mockStudentProfileRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockParentProfileRepo = { create: jest.fn(), save: jest.fn() };
const mockTeacherStudentLinkRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockParentStudentRelationRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
const mockJwtService = { sign: jest.fn().mockReturnValue("mock-jwt") };
const mockBotService = {
  notifyUserWelcome: jest.fn().mockResolvedValue(undefined),
  notifyTeacherNewStudent: jest.fn().mockResolvedValue(undefined),
};

function createService() {
  const { AuthService } = require("../auth.service");
  const service = Object.create(AuthService.prototype);
  Object.assign(service, {
    userRepository: mockUserRepo,
    teacherProfileRepository: mockTeacherProfileRepo,
    studentProfileRepository: mockStudentProfileRepo,
    parentProfileRepository: mockParentProfileRepo,
    invitationRepository: { findOne: jest.fn() },
    teacherStudentLinkRepository: mockTeacherStudentLinkRepo,
    parentStudentRelationRepository: mockParentStudentRelationRepo,
    jwtService: mockJwtService,
    telegramService: { validateInitData: jest.fn() },
    botService: mockBotService,
    logger: {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  });
  return service;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("joinByReferralWeb", () => {
  it("должен бросить NotFoundException если пользователь не найден", async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    const service = createService();

    await expect(
      service.joinByReferralWeb("nonexistent-id", "T_abc123")
    ).rejects.toThrow(NotFoundException);
  });

  it("должен бросить BadRequestException при невалидном формате кода", async () => {
    mockUserRepo.findOne.mockResolvedValue(createUser());
    const service = createService();

    await expect(
      service.joinByReferralWeb("user-web-1", "INVALID_CODE")
    ).rejects.toThrow(BadRequestException);
  });

  it("должен привязать ученика к учителю по T_ коду", async () => {
    const user = createUser();
    const newStudentProfile = { id: "new-student-1", parentInviteCode: "P_new123" };

    mockUserRepo.findOne.mockResolvedValue(user);
    mockTeacherProfileRepo.findOne.mockResolvedValue(mockTeacherProfile);
    mockStudentProfileRepo.create.mockReturnValue(newStudentProfile);
    mockStudentProfileRepo.save.mockResolvedValue(newStudentProfile);
    mockTeacherStudentLinkRepo.findOne.mockResolvedValue(null);
    mockTeacherStudentLinkRepo.create.mockReturnValue({});
    mockTeacherStudentLinkRepo.save.mockResolvedValue({});

    const service = createService();
    const result = await service.joinByReferralWeb("user-web-1", "T_abc123");

    expect(result.currentRole).toBe("student");
    expect(result.isNewConnection).toBe(true);
    expect(result.teacher.id).toBe("teacher-profile-1");
    expect(result.token).toBe("mock-jwt");
  });

  it("должен привязать родителя к ученику по P_ коду", async () => {
    const user = createUser();
    const newParentProfile = { id: "new-parent-1" };

    mockUserRepo.findOne.mockResolvedValue(user);
    mockStudentProfileRepo.findOne.mockResolvedValue(mockStudentProfile);
    mockParentProfileRepo.create.mockReturnValue(newParentProfile);
    mockParentProfileRepo.save.mockResolvedValue(newParentProfile);
    mockParentStudentRelationRepo.findOne.mockResolvedValue(null);
    mockParentStudentRelationRepo.create.mockReturnValue({});
    mockParentStudentRelationRepo.save.mockResolvedValue({});

    const service = createService();
    const result = await service.joinByReferralWeb("user-web-1", "P_xyz789");

    expect(result.currentRole).toBe("parent");
    expect(result.isNewConnection).toBe(true);
    expect(result.token).toBe("mock-jwt");
  });

  it("не должен отправлять TG-уведомления для веб-пользователей", async () => {
    const user = createUser();
    const newStudentProfile = { id: "new-student-1", parentInviteCode: "P_new123" };

    mockUserRepo.findOne.mockResolvedValue(user);
    mockTeacherProfileRepo.findOne.mockResolvedValue(mockTeacherProfile);
    mockStudentProfileRepo.create.mockReturnValue(newStudentProfile);
    mockStudentProfileRepo.save.mockResolvedValue(newStudentProfile);
    mockTeacherStudentLinkRepo.findOne.mockResolvedValue(null);
    mockTeacherStudentLinkRepo.create.mockReturnValue({});
    mockTeacherStudentLinkRepo.save.mockResolvedValue({});

    const service = createService();
    await service.joinByReferralWeb("user-web-1", "T_abc123");

    expect(mockBotService.notifyUserWelcome).not.toHaveBeenCalled();
    expect(mockBotService.notifyTeacherNewStudent).not.toHaveBeenCalled();
  });

  it("должен бросить NotFoundException если учитель не найден по коду", async () => {
    mockUserRepo.findOne.mockResolvedValue(createUser());
    mockTeacherProfileRepo.findOne.mockResolvedValue(null);
    const service = createService();

    await expect(
      service.joinByReferralWeb("user-web-1", "T_nonexistent")
    ).rejects.toThrow(NotFoundException);
  });

  it("isNewConnection=false при повторной привязке", async () => {
    const user = createUser({
      studentProfile: { id: "existing-student", parentInviteCode: "P_exist" },
    });

    mockUserRepo.findOne.mockResolvedValue(user);
    mockTeacherProfileRepo.findOne.mockResolvedValue(mockTeacherProfile);
    mockTeacherStudentLinkRepo.findOne.mockResolvedValue({ id: "existing-link" });

    const service = createService();
    const result = await service.joinByReferralWeb("user-web-1", "T_abc123");

    expect(result.isNewConnection).toBe(false);
  });
});
