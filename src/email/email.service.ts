/**
 * Сервис отправки email
 * Верификация, сброс пароля, уведомления
 */

import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private readonly fromEmail =
    process.env.SMTP_FROM || "noreply@tutorscalendar.ru";
  private readonly fromName =
    process.env.SMTP_FROM_NAME || "Tutors Calendar";
  private readonly appUrl =
    process.env.WEBAPP_URL || "https://tutorscalendar.ru";

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(
        "SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email sending disabled."
      );
      return;
    }

    const ignoreTLS = process.env.SMTP_IGNORE_TLS === "true";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ignoreTLS,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: { rejectUnauthorized: false },
    });

    this.logger.log(`SMTP configured: ${host}:${port} from=${user}`);

    this.transporter.verify().then(() => {
      this.logger.log("SMTP connection verified OK");
    }).catch((err) => {
      this.logger.error(`SMTP verification failed: ${err.message}`);
    });
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  // ============================================
  // ОТПРАВКА
  // ============================================

  async send(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (SMTP not configured): ${options.to}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent: ${options.to} subject="${options.subject}"`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(error as Error).message}`
      );
      return false;
    }
  }

  // ============================================
  // ШАБЛОНЫ
  // ============================================

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName?: string
  ): Promise<boolean> {
    const verifyUrl = `${this.appUrl}/verify-email/${token}`;
    const name = firstName || "Пользователь";

    return this.send({
      to: email,
      subject: "Подтвердите email — Tutors Calendar",
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>Спасибо за регистрацию в Tutors Calendar.</p>
        <p>Для подтверждения email нажмите на кнопку:</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="${this.buttonStyle()}">
            Подтвердить email
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Или скопируйте ссылку: <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
          Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.
        </p>
      `),
    });
  }

  async sendVerificationCode(
    email: string,
    code: string,
    firstName?: string
  ): Promise<boolean> {
    const name = firstName || "Пользователь";

    return this.send({
      to: email,
      subject: `${code} — код подтверждения Tutors Calendar`,
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>Ваш код подтверждения для регистрации в Tutors Calendar:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; background: #f3f4f6; border-radius: 12px; color: #111; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #666; font-size: 13px;">
          Код действителен 10 минут. Если вы не регистрировались — просто проигнорируйте это письмо.
        </p>
      `),
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName?: string
  ): Promise<boolean> {
    const resetUrl = `${this.appUrl}/reset-password/${token}`;
    const name = firstName || "Пользователь";

    return this.send({
      to: email,
      subject: "Сброс пароля — Tutors Calendar",
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>Вы запросили сброс пароля для вашего аккаунта в Tutors Calendar.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="${this.buttonStyle()}">
            Сбросить пароль
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Или скопируйте ссылку: <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
          Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.
        </p>
      `),
    });
  }

  async sendEmailLinkedNotification(
    email: string,
    firstName?: string
  ): Promise<boolean> {
    const name = firstName || "Пользователь";

    return this.send({
      to: email,
      subject: "Email привязан — Tutors Calendar",
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>Ваш email успешно привязан к аккаунту Tutors Calendar.</p>
        <p>Теперь вы можете входить в приложение через браузер по адресу 
          <a href="${this.appUrl}">${this.appUrl}</a>
        </p>
      `),
    });
  }

  /**
   * Уведомление о предстоящем уроке
   */
  async sendLessonReminder(
    email: string,
    lessonInfo: {
      studentName: string;
      subject: string;
      date: string;
      time: string;
      duration: number;
    },
    firstName?: string
  ): Promise<boolean> {
    const name = firstName || "Преподаватель";

    return this.send({
      to: email,
      subject: `Напоминание: урок ${lessonInfo.subject} в ${lessonInfo.time}`,
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>Напоминаем о предстоящем уроке:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Предмет</td>
            <td style="padding: 8px 0; font-weight: 600;">${lessonInfo.subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Ученик</td>
            <td style="padding: 8px 0; font-weight: 600;">${lessonInfo.studentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Дата</td>
            <td style="padding: 8px 0; font-weight: 600;">${lessonInfo.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Время</td>
            <td style="padding: 8px 0; font-weight: 600;">${lessonInfo.time} (${lessonInfo.duration} мин)</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${this.appUrl}" style="${this.buttonStyle()}">
            Открыть расписание
          </a>
        </p>
      `),
    });
  }

  /**
   * Уведомление об отмене урока
   */
  async sendLessonCancelled(
    email: string,
    lessonInfo: {
      subject: string;
      date: string;
      time: string;
      cancelledBy: string;
    },
    firstName?: string
  ): Promise<boolean> {
    const name = firstName || "Пользователь";

    return this.send({
      to: email,
      subject: `Урок отменён: ${lessonInfo.subject} ${lessonInfo.date}`,
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>Урок <strong>${lessonInfo.subject}</strong> ${lessonInfo.date} в ${lessonInfo.time} был отменён.</p>
        <p style="color: #666;">Отменил: ${lessonInfo.cancelledBy}</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${this.appUrl}" style="${this.buttonStyle()}">
            Открыть расписание
          </a>
        </p>
      `),
    });
  }

  /**
   * Уведомление о новом ученике / подключении
   */
  async sendNewStudentNotification(
    email: string,
    studentName: string,
    firstName?: string
  ): Promise<boolean> {
    const name = firstName || "Преподаватель";

    return this.send({
      to: email,
      subject: `Новый ученик: ${studentName}`,
      html: this.wrapTemplate(`
        <h2>Здравствуйте, ${name}!</h2>
        <p>К вам подключился новый ученик: <strong>${studentName}</strong>.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${this.appUrl}" style="${this.buttonStyle()}">
            Открыть приложение
          </a>
        </p>
      `),
    });
  }

  // ============================================
  // ПРИВАТНЫЕ ХЕЛПЕРЫ
  // ============================================

  private buttonStyle(): string {
    return [
      "display: inline-block",
      "padding: 14px 32px",
      "background: linear-gradient(135deg, #FFE61C, #FF7043)",
      "color: #fff",
      "text-decoration: none",
      "border-radius: 8px",
      "font-weight: 600",
      "font-size: 16px",
    ].join("; ");
  }

  private wrapTemplate(body: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <div style="max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #FFE61C, #FF7043); padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">Tutors Calendar</h1>
    </div>
    <div style="padding: 32px 24px;">
      ${body}
    </div>
    <div style="padding: 16px 24px; background: #fafafa; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0;">Tutors Calendar — управление занятиями</p>
      <p style="margin: 4px 0 0;"><a href="${this.appUrl}" style="color: #999;">${this.appUrl}</a></p>
    </div>
  </div>
</body>
</html>`;
  }
}
