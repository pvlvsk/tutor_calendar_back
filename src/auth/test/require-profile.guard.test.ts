/**
 * @file require-profile.guard.test.ts
 * @description Unit-тесты для RequireProfileGuard
 * @relatedTo src/auth/require-profile.guard.ts
 *
 * Покрывает:
 * - Пропускает запросы с валидным profileId
 * - Блокирует запросы без profileId (undefined / null / пустая строка)
 * - Блокирует запросы без user объекта
 */

import { ForbiddenException } from "@nestjs/common";
import { RequireProfileGuard } from "../require-profile.guard";

function createMockContext(user: any, url = "/api/teachers/me") {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, url }),
    }),
  } as any;
}

describe("RequireProfileGuard", () => {
  let guard: RequireProfileGuard;

  beforeEach(() => {
    guard = new RequireProfileGuard();
  });

  it("должен пропустить запрос с валидным profileId", () => {
    const context = createMockContext({
      sub: "user-uuid",
      role: "teacher",
      profileId: "profile-uuid-123",
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("должен заблокировать запрос без profileId (undefined)", () => {
    const context = createMockContext({
      sub: "user-uuid",
      role: "teacher",
      profileId: undefined,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("должен заблокировать запрос с profileId = null", () => {
    const context = createMockContext({
      sub: "user-uuid",
      role: "teacher",
      profileId: null,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("должен заблокировать запрос с пустым profileId", () => {
    const context = createMockContext({
      sub: "user-uuid",
      role: "teacher",
      profileId: "",
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("должен заблокировать запрос без user объекта", () => {
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("должен заблокировать запрос с user = undefined", () => {
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("сообщение об ошибке должно содержать PROFILE_REQUIRED", () => {
    const context = createMockContext({
      sub: "user-uuid",
      role: "teacher",
      profileId: null,
    });

    try {
      guard.canActivate(context);
      fail("Expected ForbiddenException");
    } catch (error: any) {
      expect(error.message).toContain("PROFILE_REQUIRED");
    }
  });
});
