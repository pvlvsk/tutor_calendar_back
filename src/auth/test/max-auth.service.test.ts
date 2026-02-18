/**
 * @file max-auth.service.test.ts
 * @description Unit-тесты для MaxAuthService
 * @relatedTo src/auth/max-auth.service.ts
 *
 * Покрывает:
 * - initMax: поиск существующего пользователя / новый пользователь / невалидный initData
 * - linkMax: привязка MAX к аккаунту / конфликт / невалидный initData
 * - generateToken: наличие profileId в JWT payload
 * - formatUser: наличие maxId в ответе
 */

import { UnauthorizedException, ConflictException } from "@nestjs/common";

const mockMaxUser = {
  id: 15071600,
  first_name: "Dmitriy",
  last_name: "Pavlovskii",
  username: "dpavlovskii",
};

const mockTeacherProfile = { id: "profile-teacher-123" };

const mockUser = {
  id: "user-uuid-001",
  maxId: "15071600",
  telegramId: "705554674",
  firstName: "Dmitriy",
  lastName: "Pavlovskii",
  username: "dpavlovskii",
  email: "pvlvsk.d@gmail.com",
  emailVerified: true,
  isBetaTester: false,
  teacherProfile: mockTeacherProfile,
  studentProfile: null,
  parentProfile: null,
};

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue("mock-jwt-token"),
};

const mockMaxService = {
  validateInitData: jest.fn(),
};

// Импортируем класс, чтобы тестировать приватные методы через прототип
// Но лучше тестировать через публичные методы (initMax, linkMax)
function createService() {
  const { MaxAuthService } = require("../max-auth.service");
  return new MaxAuthService(
    mockUserRepo,
    {} as any, // teacherProfileRepo
    {} as any, // studentProfileRepo
    {} as any, // parentProfileRepo
    mockJwtService,
    mockMaxService,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// initMax
// ============================================

describe("MaxAuthService — initMax", () => {
  it("должен вернуть isNewUser=false и токен для существующего пользователя", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.initMax("valid-init-data");

    expect(result.isNewUser).toBe(false);
    expect(result.token).toBe("mock-jwt-token");
    expect(result.user).toBeDefined();
    expect(result.roles).toContain("teacher");
    expect(result.currentRole).toBe("teacher");
  });

  it("должен вернуть isNewUser=true если пользователь не найден", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue(null);

    const result = await service.initMax("valid-init-data");

    expect(result.isNewUser).toBe(true);
    expect(result.token).toBeNull();
    expect(result.user).toBeNull();
    expect(result.roles).toEqual([]);
  });

  it("должен бросить UnauthorizedException при невалидном initData", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(null);

    await expect(service.initMax("invalid-data")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("JWT должен содержать profileId", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    await service.initMax("valid-init-data");

    expect(mockJwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: mockUser.id,
        profileId: mockTeacherProfile.id,
        role: "teacher",
        maxId: Number(mockUser.maxId),
      }),
    );
  });

  it("JWT должен содержать isBetaTester", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue({ ...mockUser, isBetaTester: true });

    await service.initMax("valid-init-data");

    expect(mockJwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ isBetaTester: true }),
    );
  });

  it("formatUser должен включать maxId", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.initMax("valid-init-data");

    expect(result.user).toHaveProperty("maxId");
    expect(result.user.maxId).toBe(Number(mockUser.maxId));
  });

  it("formatUser должен включать telegramId", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.initMax("valid-init-data");

    expect(result.user).toHaveProperty("telegramId");
    expect(result.user.telegramId).toBe(Number(mockUser.telegramId));
  });
});

// ============================================
// linkMax
// ============================================

describe("MaxAuthService — linkMax", () => {
  it("должен привязать MAX к пользователю", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne
      .mockResolvedValueOnce(null) // existingMaxUser — не найден
      .mockResolvedValueOnce({ ...mockUser, maxId: null }); // user
    mockUserRepo.save.mockResolvedValue({ ...mockUser });

    const result = await service.linkMax("user-uuid-001", "valid-init-data");

    expect(result.success).toBe(true);
    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ maxId: String(mockMaxUser.id) }),
    );
  });

  it("должен бросить ConflictException если maxId уже привязан к другому пользователю", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValueOnce({
      id: "other-user-uuid",
      email: "other@test.com",
    });

    await expect(
      service.linkMax("user-uuid-001", "valid-init-data"),
    ).rejects.toThrow(ConflictException);
  });

  it("должен бросить UnauthorizedException при невалидном initData", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(null);

    await expect(
      service.linkMax("user-uuid-001", "invalid-data"),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("должен бросить UnauthorizedException если пользователь не найден", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne
      .mockResolvedValueOnce(null) // existingMaxUser
      .mockResolvedValueOnce(null); // user

    await expect(
      service.linkMax("nonexistent-user", "valid-init-data"),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("не должен бросать ошибку если maxId уже привязан к этому же пользователю", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne
      .mockResolvedValueOnce({ id: "user-uuid-001" }) // existingMaxUser — тот же юзер
      .mockResolvedValueOnce({ ...mockUser, maxId: null });
    mockUserRepo.save.mockResolvedValue(mockUser);

    const result = await service.linkMax("user-uuid-001", "valid-init-data");
    expect(result.success).toBe(true);
  });
});

// ============================================
// Безопасность: profileId в токене
// ============================================

describe("MaxAuthService — Безопасность JWT", () => {
  it("profileId не должен быть undefined в JWT для пользователя с профилем", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue(mockUser);

    await service.initMax("valid-init-data");

    const signCall = mockJwtService.sign.mock.calls[0][0];
    expect(signCall.profileId).toBeDefined();
    expect(signCall.profileId).not.toBe("");
    expect(signCall.profileId).toBe(mockTeacherProfile.id);
  });

  it("profileId должен быть пустой строкой если у пользователя нет профилей", async () => {
    const service = createService();
    mockMaxService.validateInitData.mockReturnValue(mockMaxUser);
    mockUserRepo.findOne.mockResolvedValue({
      ...mockUser,
      teacherProfile: null,
      studentProfile: null,
      parentProfile: null,
    });

    await service.initMax("valid-init-data");

    const signCall = mockJwtService.sign.mock.calls[0][0];
    expect(signCall.profileId).toBe("");
  });
});
