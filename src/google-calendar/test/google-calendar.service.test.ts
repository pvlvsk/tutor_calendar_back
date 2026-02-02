/**
 * @relatedTo ../google-calendar.service.ts
 *
 * Unit тесты для GoogleCalendarService:
 * - Генерация auth URL
 * - Обработка callback
 * - Подключение/отключение
 * - Получение статуса
 * - Получение событий
 */

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GoogleCalendarService } from "../google-calendar.service";
import { User } from "../../database/entities";

// Мокаем googleapis
jest.mock("googleapis", () => {
  const mockOAuth2Client = {
    generateAuthUrl: jest.fn().mockReturnValue("https://accounts.google.com/o/oauth2/..."),
    getToken: jest.fn().mockResolvedValue({
      tokens: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    }),
    setCredentials: jest.fn(),
  };

  const mockCalendar = {
    events: {
      list: jest.fn().mockResolvedValue({
        data: {
          items: [
            {
              id: "event-1",
              summary: "Урок математики",
              description: "Подготовка к ЕГЭ",
              start: { dateTime: "2024-01-15T10:00:00+03:00" },
              end: { dateTime: "2024-01-15T11:00:00+03:00" },
              recurringEventId: "recurring-parent-1",
            },
            {
              id: "event-2",
              summary: "Урок физики",
              start: { dateTime: "2024-01-15T12:00:00+03:00" },
              end: { dateTime: "2024-01-15T13:00:00+03:00" },
            },
          ],
        },
      }),
      insert: jest.fn().mockResolvedValue({
        data: { id: "new-event-id" },
      }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  const mockOauth2 = {
    userinfo: {
      get: jest.fn().mockResolvedValue({
        data: { email: "user@gmail.com" },
      }),
    },
  };

  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client),
      },
      calendar: jest.fn().mockReturnValue(mockCalendar),
      oauth2: jest.fn().mockReturnValue(mockOauth2),
    },
  };
});

describe("GoogleCalendarService", () => {
  let service: GoogleCalendarService;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockUser: Partial<User> = {
    id: "user-uuid-1",
    googleRefreshToken: "mock-refresh-token",
    googleCalendarConnected: true,
    googleEmail: "user@gmail.com",
  };

  beforeEach(async () => {
    const mockUserRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<GoogleCalendarService>(GoogleCalendarService);
    userRepo = module.get(getRepositoryToken(User));

    // Устанавливаем env переменные для тестов
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/callback";
  });

  describe("getAuthUrl", () => {
    it("генерирует URL для OAuth авторизации", () => {
      const state = "user-uuid-1";
      const url = service.getAuthUrl(state);

      expect(url).toContain("accounts.google.com");
    });
  });

  describe("handleCallback", () => {
    it("обменивает код на токены и сохраняет данные", async () => {
      const code = "auth-code-123";
      const userId = "user-uuid-1";

      userRepo.update.mockResolvedValue({} as any);

      const result = await service.handleCallback(code, userId);

      expect(userRepo.update).toHaveBeenCalledWith(userId, {
        googleRefreshToken: "mock-refresh-token",
        googleCalendarConnected: true,
        googleEmail: "user@gmail.com",
      });
      expect(result.email).toBe("user@gmail.com");
    });
  });

  describe("disconnect", () => {
    it("удаляет данные подключения", async () => {
      const userId = "user-uuid-1";

      userRepo.update.mockResolvedValue({} as any);

      await service.disconnect(userId);

      expect(userRepo.update).toHaveBeenCalledWith(userId, {
        googleRefreshToken: null,
        googleCalendarConnected: false,
        googleEmail: null,
      });
    });
  });

  describe("getStatus", () => {
    it("возвращает статус подключённого календаря", async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.getStatus("user-uuid-1");

      expect(result).toEqual({
        connected: true,
        email: "user@gmail.com",
      });
    });

    it("возвращает false если календарь не подключён", async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        googleCalendarConnected: false,
        googleEmail: null,
      } as User);

      const result = await service.getStatus("user-uuid-1");

      expect(result.connected).toBe(false);
      expect(result.email).toBeNull();
    });

    it("возвращает false если пользователь не найден", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.getStatus("non-existent");

      expect(result.connected).toBe(false);
      expect(result.email).toBeNull();
    });
  });

  describe("getEvents", () => {
    it("возвращает события из Google Calendar", async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const timeMin = new Date("2024-01-01");
      const timeMax = new Date("2024-01-31");

      const events = await service.getEvents("user-uuid-1", timeMin, timeMax);

      expect(events).toHaveLength(2);
      expect(events[0].summary).toBe("Урок математики");
      expect(events[0].description).toBe("Подготовка к ЕГЭ");
      expect(events[0].recurringEventId).toBe("recurring-parent-1");
      expect(events[1].summary).toBe("Урок физики");
      expect(events[1].recurringEventId).toBeUndefined();
    });

    it("бросает ошибку если календарь не подключён", async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        googleRefreshToken: null,
      } as User);

      await expect(
        service.getEvents("user-uuid-1", new Date(), new Date())
      ).rejects.toThrow("Google Calendar not connected");
    });
  });

  describe("createEvent", () => {
    it("создаёт событие и возвращает ID", async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const event = {
        summary: "Новый урок",
        start: new Date("2024-01-20T10:00:00"),
        end: new Date("2024-01-20T11:00:00"),
      };

      const eventId = await service.createEvent("user-uuid-1", event);

      expect(eventId).toBe("new-event-id");
    });
  });

  describe("deleteEvent", () => {
    it("удаляет событие по ID", async () => {
      userRepo.findOne.mockResolvedValue(mockUser as User);

      await expect(
        service.deleteEvent("user-uuid-1", "event-to-delete")
      ).resolves.not.toThrow();
    });
  });
});
