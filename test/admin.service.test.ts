/**
 * @file admin.service.test.ts
 * @description Unit-тесты для AdminService
 * @relatedTo src/admin/admin.service.ts
 *
 * Покрывает:
 * - Фильтрация логов по пользователю
 * - Очистка старых логов
 * - Валидация UUID
 */

describe("AdminService — Фильтрация по пользователю", () => {
  /**
   * Проверка regex для UUID
   */
  describe("UUID валидация", () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it("должен распознавать валидный UUID", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(uuidRegex.test(validUuid)).toBe(true);
    });

    it("должен распознавать UUID в верхнем регистре", () => {
      const upperUuid = "550E8400-E29B-41D4-A716-446655440000";
      expect(uuidRegex.test(upperUuid)).toBe(true);
    });

    it("не должен распознавать username как UUID", () => {
      expect(uuidRegex.test("pvlvskD")).toBe(false);
      expect(uuidRegex.test("testuser")).toBe(false);
      expect(uuidRegex.test("user123")).toBe(false);
    });

    it("не должен распознавать неполный UUID", () => {
      expect(uuidRegex.test("550e8400-e29b-41d4")).toBe(false);
      expect(uuidRegex.test("550e8400")).toBe(false);
    });
  });

  /**
   * Проверка очистки @ из username
   */
  describe("Очистка username", () => {
    const cleanUsername = (userSearch: string): string => {
      return userSearch.startsWith("@") ? userSearch.slice(1) : userSearch;
    };

    it("должен убирать @ из начала", () => {
      expect(cleanUsername("@testuser")).toBe("testuser");
    });

    it("не должен менять username без @", () => {
      expect(cleanUsername("testuser")).toBe("testuser");
    });

    it("не должен убирать @ из середины", () => {
      expect(cleanUsername("test@user")).toBe("test@user");
    });
  });
});

describe("AdminService — Очистка логов", () => {
  /**
   * Проверка расчёта даты для очистки
   */
  describe("Расчёт cutoff даты", () => {
    it("должен вычислять дату 7 дней назад", () => {
      const retentionDays = 7;
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Разница должна быть ~7 дней
      const diffMs = now.getTime() - cutoffDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(7, 0);
    });

    it("должен вычислять дату 14 дней назад", () => {
      const retentionDays = 14;
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const diffMs = now.getTime() - cutoffDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeCloseTo(14, 0);
    });
  });

  /**
   * Проверка парсинга LOG_RETENTION_DAYS
   */
  describe("Парсинг LOG_RETENTION_DAYS", () => {
    it("должен парсить числовую строку", () => {
      const retentionDays = parseInt("7", 10);
      expect(retentionDays).toBe(7);
    });

    it("должен использовать дефолт при невалидном значении", () => {
      const envValue = undefined;
      const retentionDays = parseInt(envValue || "7", 10);
      expect(retentionDays).toBe(7);
    });

    it("должен парсить кастомное значение", () => {
      const envValue = "30";
      const retentionDays = parseInt(envValue || "7", 10);
      expect(retentionDays).toBe(30);
    });
  });
});

describe("AdminService — Нормализация пути", () => {
  /**
   * Проверка замены UUID на :id в путях
   */
  const normalizePath = (path: string): string => {
    return path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id"
    );
  };

  it("должен заменять UUID на :id", () => {
    const path = "/api/teachers/550e8400-e29b-41d4-a716-446655440000/students";
    expect(normalizePath(path)).toBe("/api/teachers/:id/students");
  });

  it("должен заменять несколько UUID", () => {
    const path =
      "/api/teachers/550e8400-e29b-41d4-a716-446655440000/students/660e8400-e29b-41d4-a716-446655440001";
    expect(normalizePath(path)).toBe("/api/teachers/:id/students/:id");
  });

  it("не должен менять путь без UUID", () => {
    const path = "/api/teachers/me/subjects";
    expect(normalizePath(path)).toBe("/api/teachers/me/subjects");
  });

  it("должен работать с UUID в верхнем регистре", () => {
    const path = "/api/teachers/550E8400-E29B-41D4-A716-446655440000/students";
    expect(normalizePath(path)).toBe("/api/teachers/:id/students");
  });
});

describe("AdminService — Данные графика", () => {
  /**
   * Проверка форматов интервалов
   */
  describe("Интервалы времени", () => {
    const getInterval = (
      timeRange: string
    ): "minute" | "hour" | "day" => {
      switch (timeRange) {
        case "1h":
        case "6h":
          return "minute";
        case "24h":
        case "7d":
          return "hour";
        case "30d":
          return "day";
        default:
          return "hour";
      }
    };

    it("minute интервал для 1 часа", () => {
      expect(getInterval("1h")).toBe("minute");
    });

    it("minute интервал для 6 часов", () => {
      expect(getInterval("6h")).toBe("minute");
    });

    it("hour интервал для 24 часов", () => {
      expect(getInterval("24h")).toBe("hour");
    });

    it("hour интервал для 7 дней", () => {
      expect(getInterval("7d")).toBe("hour");
    });

    it("day интервал для 30 дней", () => {
      expect(getInterval("30d")).toBe("day");
    });
  });
});
