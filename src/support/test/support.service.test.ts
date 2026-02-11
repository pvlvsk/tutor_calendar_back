/**
 * @relatedTo ../support.service.ts
 *
 * Unit тесты для SupportService:
 * - Создание сообщений (от пользователя и с лендинга)
 * - Получение сообщений пользователя
 * - Получение всех сообщений (админ), включая сообщения с null user
 * - Обновление статуса
 * - Подсчёт новых сообщений
 */

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { SupportService } from "../support.service";
import { SupportMessage, SupportMessageStatus } from "../../database/entities";

describe("SupportService", () => {
  let service: SupportService;
  let repo: jest.Mocked<Repository<SupportMessage>>;

  const mockUser = {
    id: "user-uuid-1",
    firstName: "Иван",
    lastName: "Иванов",
    username: "ivanov",
    telegramId: "123456789",
  };

  const mockMessage: SupportMessage = {
    id: "msg-uuid-1",
    userId: mockUser.id,
    user: mockUser as any,
    subject: "Тестовая тема",
    message: "Текст сообщения",
    status: "new" as SupportMessageStatus,
    adminNotes: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
  };

  const mockLandingMessage: SupportMessage = {
    id: "msg-uuid-landing-1",
    userId: null,
    user: null,
    subject: "[Лендинг] Анна (@anna_tg)",
    message: "Хочу узнать подробнее",
    status: "new" as SupportMessageStatus,
    adminNotes: null,
    createdAt: new Date("2024-01-16T12:00:00Z"),
    updatedAt: new Date("2024-01-16T12:00:00Z"),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(SupportMessage),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    repo = module.get(getRepositoryToken(SupportMessage));
  });

  // =========================================================================
  // createMessage
  // =========================================================================
  describe("createMessage", () => {
    it("создаёт новое сообщение в поддержку", async () => {
      const userId = "user-uuid-1";
      const subject = "Вопрос";
      const message = "Текст вопроса";

      repo.create.mockReturnValue({
        ...mockMessage,
        subject,
        message,
      } as SupportMessage);
      repo.save.mockResolvedValue({
        ...mockMessage,
        subject,
        message,
      });

      const result = await service.createMessage(userId, subject, message);

      expect(repo.create).toHaveBeenCalledWith({
        userId,
        subject,
        message,
        status: "new",
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result.subject).toBe(subject);
      expect(result.message).toBe(message);
    });
  });

  // =========================================================================
  // createLandingMessage
  // =========================================================================
  describe("createLandingMessage", () => {
    it("создаёт анонимное сообщение с лендинга (с контактом)", async () => {
      const name = "Анна";
      const message = "Хочу узнать подробнее";
      const contact = "@anna_tg";

      repo.create.mockReturnValue({ ...mockLandingMessage } as SupportMessage);
      repo.save.mockResolvedValue({ ...mockLandingMessage });

      const result = await service.createLandingMessage(name, message, contact);

      expect(repo.create).toHaveBeenCalledWith({
        subject: "[Лендинг] Анна (@anna_tg)",
        message,
        status: "new",
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result.userId).toBeNull();
    });

    it("создаёт анонимное сообщение с лендинга (без контакта)", async () => {
      const name = "Пётр";
      const message = "Вопрос по приложению";

      const msgWithoutContact: SupportMessage = {
        ...mockLandingMessage,
        subject: "[Лендинг] Пётр",
      };

      repo.create.mockReturnValue(msgWithoutContact);
      repo.save.mockResolvedValue(msgWithoutContact);

      const result = await service.createLandingMessage(name, message);

      expect(repo.create).toHaveBeenCalledWith({
        subject: "[Лендинг] Пётр",
        message,
        status: "new",
      });
      expect(result.subject).toBe("[Лендинг] Пётр");
    });
  });

  // =========================================================================
  // getUserMessages
  // =========================================================================
  describe("getUserMessages", () => {
    it("возвращает сообщения пользователя в порядке убывания даты", async () => {
      const userId = "user-uuid-1";
      const messages = [
        { ...mockMessage, id: "msg-2", createdAt: new Date("2024-01-16") },
        { ...mockMessage, id: "msg-1", createdAt: new Date("2024-01-15") },
      ];

      repo.find.mockResolvedValue(messages as SupportMessage[]);

      const result = await service.getUserMessages(userId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("msg-2");
    });

    it("возвращает пустой массив если нет сообщений", async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.getUserMessages("user-without-messages");

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getAllMessages
  // =========================================================================
  describe("getAllMessages", () => {
    function createMockQueryBuilder(overrides: Record<string, any> = {}) {
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
        ...overrides,
      };
    }

    it("возвращает все сообщения с пагинацией", async () => {
      const qb = createMockQueryBuilder({
        getCount: jest.fn().mockResolvedValue(10),
        getMany: jest.fn().mockResolvedValue([
          { ...mockMessage, user: mockUser },
        ]),
      });

      repo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getAllMessages(1, 50);

      expect(result.total).toBe(10);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].user).not.toBeNull();
      expect(result.messages[0].user!.username).toBe("ivanov");
    });

    it("корректно возвращает сообщения с user = null (лендинг)", async () => {
      const qb = createMockQueryBuilder({
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([
          { ...mockLandingMessage, user: null },
        ]),
      });

      repo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getAllMessages(1, 50);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].user).toBeNull();
      expect(result.messages[0].subject).toBe("[Лендинг] Анна (@anna_tg)");
    });

    it("корректно маппит смешанные сообщения (с user и без)", async () => {
      const qb = createMockQueryBuilder({
        getCount: jest.fn().mockResolvedValue(2),
        getMany: jest.fn().mockResolvedValue([
          { ...mockMessage, user: mockUser },
          { ...mockLandingMessage, user: null },
        ]),
      });

      repo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.getAllMessages(1, 50);

      expect(result.messages).toHaveLength(2);
      // Первое — от авторизованного пользователя
      expect(result.messages[0].user).not.toBeNull();
      expect(result.messages[0].user!.id).toBe("user-uuid-1");
      // Второе — с лендинга (анонимное)
      expect(result.messages[1].user).toBeNull();
    });

    it("фильтрует по статусу", async () => {
      const qb = createMockQueryBuilder({
        getCount: jest.fn().mockResolvedValue(5),
      });

      repo.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllMessages(1, 50, "in_progress");

      expect(qb.where).toHaveBeenCalledWith("sm.status = :status", {
        status: "in_progress",
      });
    });

    it("не вызывает where если статус не указан", async () => {
      const qb = createMockQueryBuilder({
        getCount: jest.fn().mockResolvedValue(0),
      });

      repo.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllMessages(1, 50);

      expect(qb.where).not.toHaveBeenCalled();
    });

    it("правильно считает skip для второй страницы", async () => {
      const qb = createMockQueryBuilder({
        getCount: jest.fn().mockResolvedValue(100),
      });

      repo.createQueryBuilder.mockReturnValue(qb as any);

      await service.getAllMessages(3, 20);

      expect(qb.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(qb.take).toHaveBeenCalledWith(20);
    });
  });

  // =========================================================================
  // getNewMessagesCount
  // =========================================================================
  describe("getNewMessagesCount", () => {
    it("возвращает количество новых сообщений", async () => {
      repo.count.mockResolvedValue(5);

      const result = await service.getNewMessagesCount();

      expect(repo.count).toHaveBeenCalledWith({ where: { status: "new" } });
      expect(result).toBe(5);
    });

    it("возвращает 0 если новых сообщений нет", async () => {
      repo.count.mockResolvedValue(0);

      const result = await service.getNewMessagesCount();

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // updateMessage
  // =========================================================================
  describe("updateMessage", () => {
    it("обновляет статус сообщения", async () => {
      const messageId = "msg-uuid-1";
      const newStatus: SupportMessageStatus = "in_progress";

      repo.findOne.mockResolvedValue({ ...mockMessage });
      repo.save.mockResolvedValue({
        ...mockMessage,
        status: newStatus,
      });

      const result = await service.updateMessage(messageId, {
        status: newStatus,
      });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: messageId } });
      expect(result.status).toBe(newStatus);
    });

    it("обновляет заметки администратора", async () => {
      const messageId = "msg-uuid-1";
      const adminNotes = "Связались с пользователем";

      repo.findOne.mockResolvedValue({ ...mockMessage });
      repo.save.mockResolvedValue({
        ...mockMessage,
        adminNotes,
      });

      const result = await service.updateMessage(messageId, { adminNotes });

      expect(result.adminNotes).toBe(adminNotes);
    });

    it("бросает NotFoundException если сообщение не найдено", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMessage("non-existent", { status: "closed" })
      ).rejects.toThrow(NotFoundException);
    });

    it("обновляет и статус и заметки одновременно", async () => {
      const messageId = "msg-uuid-1";
      const data = {
        status: "resolved" as SupportMessageStatus,
        adminNotes: "Решено",
      };

      repo.findOne.mockResolvedValue({ ...mockMessage });
      repo.save.mockImplementation((msg) => Promise.resolve(msg as any));

      const result = await service.updateMessage(messageId, data);

      expect(result.status).toBe("resolved");
      expect(result.adminNotes).toBe("Решено");
    });

    it("обновляет анонимное сообщение с лендинга", async () => {
      const messageId = "msg-uuid-landing-1";
      const data = {
        status: "in_progress" as SupportMessageStatus,
        adminNotes: "Ответили на email",
      };

      repo.findOne.mockResolvedValue({ ...mockLandingMessage });
      repo.save.mockImplementation((msg) => Promise.resolve(msg as any));

      const result = await service.updateMessage(messageId, data);

      expect(result.status).toBe("in_progress");
      expect(result.adminNotes).toBe("Ответили на email");
      expect(result.userId).toBeNull();
    });
  });
});
