import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportMessage, SupportMessageStatus } from "../database/entities";

export interface SupportMessageWithUser {
  id: string;
  subject: string;
  message: string;
  status: SupportMessageStatus;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    telegramId: string | null;
    email: string | null;
  } | null;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportMessage)
    private readonly supportMessageRepo: Repository<SupportMessage>
  ) {}

  /**
   * Создать новое сообщение в поддержку
   */
  async createMessage(
    userId: string,
    subject: string,
    message: string
  ): Promise<SupportMessage> {
    const supportMessage = this.supportMessageRepo.create({
      userId,
      subject,
      message,
      status: "new",
    });

    const saved = await this.supportMessageRepo.save(supportMessage);
    this.logger.log(`Support message created: ${saved.id} by user ${userId}`);
    return saved;
  }

  /**
   * Создать сообщение с лендинга (без авторизации)
   */
  async createLandingMessage(
    name: string,
    message: string,
    contact?: string
  ): Promise<SupportMessage> {
    const subject = `[Лендинг] ${name}${contact ? ` (${contact})` : ""}`;
    const supportMessage = this.supportMessageRepo.create({
      subject,
      message,
      status: "new",
      // userId остаётся null — это анонимное сообщение с лендинга
    });

    const saved = await this.supportMessageRepo.save(supportMessage);
    this.logger.log(`Landing support message created: ${saved.id} from ${name}`);
    return saved;
  }

  /**
   * Получить все сообщения пользователя
   */
  async getUserMessages(userId: string): Promise<SupportMessage[]> {
    return this.supportMessageRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Получить все сообщения (для админки)
   */
  async getAllMessages(
    page: number = 1,
    limit: number = 50,
    status?: SupportMessageStatus
  ): Promise<{ messages: SupportMessageWithUser[]; total: number }> {
    const query = this.supportMessageRepo
      .createQueryBuilder("sm")
      .leftJoinAndSelect("sm.user", "user")
      .orderBy("sm.createdAt", "DESC");

    if (status) {
      query.where("sm.status = :status", { status });
    }

    const total = await query.getCount();
    const messages = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      messages: messages.map((m) => ({
        id: m.id,
        subject: m.subject,
        message: m.message,
        status: m.status,
        adminNotes: m.adminNotes,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        user: m.user
          ? {
              id: m.user.id,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              username: m.user.username,
              telegramId: m.user.telegramId,
              email: m.user.email || null,
            }
          : null,
      })),
      total,
    };
  }

  /**
   * Получить количество новых сообщений (для бейджа)
   */
  async getNewMessagesCount(): Promise<number> {
    return this.supportMessageRepo.count({ where: { status: "new" } });
  }

  /**
   * Обновить статус/заметки сообщения (для админки)
   */
  async updateMessage(
    id: string,
    data: { status?: SupportMessageStatus; adminNotes?: string }
  ): Promise<SupportMessage> {
    const message = await this.supportMessageRepo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException("Сообщение не найдено");
    }

    if (data.status !== undefined) {
      message.status = data.status;
    }
    if (data.adminNotes !== undefined) {
      message.adminNotes = data.adminNotes;
    }

    return this.supportMessageRepo.save(message);
  }
}
