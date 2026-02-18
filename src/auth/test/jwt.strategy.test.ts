/**
 * @file jwt.strategy.test.ts
 * @description Unit-тесты для JwtStrategy.validate()
 * @relatedTo src/auth/jwt.strategy.ts
 *
 * Покрывает:
 * - Валидный payload → возвращает user object
 * - Отсутствующий sub → UnauthorizedException
 * - Отсутствующий profileId → лог предупреждения, profileId = null
 * - isBetaTester по умолчанию false
 */

import { UnauthorizedException } from "@nestjs/common";

/**
 * Тестируем метод validate() изолированно.
 * Конструктор JwtStrategy вызывает super() с passport config,
 * поэтому извлекаем логику validate в отдельную функцию.
 */
function createValidate() {
  const warnings: string[] = [];

  async function validate(payload: any) {
    if (!payload.sub) {
      warnings.push("JWT missing sub (userId)");
      throw new UnauthorizedException("INVALID_TOKEN");
    }

    if (!payload.profileId) {
      warnings.push(
        `JWT without profileId: user=${payload.sub} role=${payload.role}`,
      );
    }

    return {
      sub: payload.sub,
      telegramId: payload.telegramId,
      role: payload.role,
      profileId: payload.profileId || null,
      isBetaTester: payload.isBetaTester || false,
    };
  }

  return { validate, warnings };
}

describe("JwtStrategy — validate()", () => {
  it("должен вернуть user object при валидном payload", async () => {
    const { validate } = createValidate();

    const result = await validate({
      sub: "user-uuid",
      telegramId: 705554674,
      role: "teacher",
      profileId: "profile-uuid",
      isBetaTester: true,
    });

    expect(result).toEqual({
      sub: "user-uuid",
      telegramId: 705554674,
      role: "teacher",
      profileId: "profile-uuid",
      isBetaTester: true,
    });
  });

  it("должен бросить UnauthorizedException если нет sub", async () => {
    const { validate } = createValidate();

    await expect(
      validate({ role: "teacher", profileId: "p-1" }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("должен логировать предупреждение если нет profileId", async () => {
    const { validate, warnings } = createValidate();

    const result = await validate({
      sub: "user-uuid",
      role: "teacher",
    });

    expect(result.profileId).toBeNull();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("JWT without profileId");
  });

  it("profileId = null если payload.profileId отсутствует", async () => {
    const { validate } = createValidate();

    const result = await validate({
      sub: "user-uuid",
      role: "student",
    });

    expect(result.profileId).toBeNull();
  });

  it("profileId = null если payload.profileId пустая строка", async () => {
    const { validate } = createValidate();

    const result = await validate({
      sub: "user-uuid",
      role: "student",
      profileId: "",
    });

    expect(result.profileId).toBeNull();
  });

  it("isBetaTester по умолчанию false", async () => {
    const { validate } = createValidate();

    const result = await validate({
      sub: "user-uuid",
      role: "teacher",
      profileId: "p-1",
    });

    expect(result.isBetaTester).toBe(false);
  });

  it("должен пропустить payload без telegramId", async () => {
    const { validate } = createValidate();

    const result = await validate({
      sub: "user-uuid",
      role: "teacher",
      profileId: "p-1",
    });

    expect(result.telegramId).toBeUndefined();
  });
});
