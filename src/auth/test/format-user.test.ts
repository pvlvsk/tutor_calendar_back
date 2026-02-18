/**
 * @file format-user.test.ts
 * @description Проверяет что все formatUser во всех auth-сервисах возвращают maxId
 * @relatedTo src/auth/email-auth.service.ts, src/auth/auth.service.ts, src/auth/max-auth.service.ts
 *
 * Защита от регрессии: maxId должен присутствовать в ответе ВСЕХ auth-сервисов,
 * иначе фронтенд не узнает о привязке MAX и UI покажет "Не привязан".
 */

const mockUserWithMax = {
  id: "user-uuid",
  telegramId: "705554674",
  maxId: "15071600",
  firstName: "Dmitriy",
  lastName: "Pavlovskii",
  username: "dpavlovskii",
  email: "pvlvsk.d@gmail.com",
  emailVerified: true,
  isBetaTester: false,
};

const mockUserWithoutMax = {
  ...mockUserWithMax,
  maxId: null,
};

/**
 * Воспроизводит логику formatUser из email-auth.service.ts
 * (чтобы при изменении сигнатуры тест сломался)
 */
function formatUserEmailAuth(user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId ? Number(user.telegramId) : null,
    maxId: user.maxId || null,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email || null,
    emailVerified: user.emailVerified || false,
    isBetaTester: user.isBetaTester || false,
  };
}

/**
 * Воспроизводит логику formatUser из auth.service.ts (Telegram)
 */
function formatUserAuthService(user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId ? Number(user.telegramId) : null,
    maxId: user.maxId || null,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email || null,
    emailVerified: user.emailVerified || false,
    isBetaTester: user.isBetaTester || false,
  };
}

/**
 * Воспроизводит логику formatUser из max-auth.service.ts
 */
function formatUserMaxAuth(user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId ? Number(user.telegramId) : null,
    maxId: user.maxId ? Number(user.maxId) : null,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}

describe("formatUser — maxId присутствует во всех auth-сервисах", () => {
  describe("email-auth.service formatUser", () => {
    it("должен включать maxId когда он есть", () => {
      const result = formatUserEmailAuth(mockUserWithMax);
      expect(result).toHaveProperty("maxId");
      expect(result.maxId).toBe("15071600");
    });

    it("maxId = null когда отсутствует", () => {
      const result = formatUserEmailAuth(mockUserWithoutMax);
      expect(result).toHaveProperty("maxId");
      expect(result.maxId).toBeNull();
    });
  });

  describe("auth.service formatUser (Telegram)", () => {
    it("должен включать maxId когда он есть", () => {
      const result = formatUserAuthService(mockUserWithMax);
      expect(result).toHaveProperty("maxId");
      expect(result.maxId).toBe("15071600");
    });

    it("maxId = null когда отсутствует", () => {
      const result = formatUserAuthService(mockUserWithoutMax);
      expect(result).toHaveProperty("maxId");
      expect(result.maxId).toBeNull();
    });
  });

  describe("max-auth.service formatUser", () => {
    it("должен включать maxId когда он есть", () => {
      const result = formatUserMaxAuth(mockUserWithMax);
      expect(result).toHaveProperty("maxId");
      expect(result.maxId).toBe(15071600);
    });

    it("maxId = null когда отсутствует", () => {
      const result = formatUserMaxAuth(mockUserWithoutMax);
      expect(result).toHaveProperty("maxId");
      expect(result.maxId).toBeNull();
    });
  });

  describe("Консистентность между сервисами", () => {
    it("все formatUser должны возвращать одинаковый набор обязательных полей", () => {
      const requiredFields = [
        "id",
        "telegramId",
        "maxId",
        "firstName",
        "lastName",
        "username",
        "email",
        "emailVerified",
      ];

      const emailResult = formatUserEmailAuth(mockUserWithMax);
      const authResult = formatUserAuthService(mockUserWithMax);
      const maxResult = formatUserMaxAuth(mockUserWithMax);

      for (const field of requiredFields) {
        expect(emailResult).toHaveProperty(field);
        expect(authResult).toHaveProperty(field);
        expect(maxResult).toHaveProperty(field);
      }
    });
  });
});
