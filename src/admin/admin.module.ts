import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import {
  AdminUser,
  RequestLog,
  AnalyticsEvent,
  User,
  TeacherProfile,
  StudentProfile,
  SupportMessage,
} from "../database/entities";
import { SupportModule } from "../support/support.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      RequestLog,
      AnalyticsEvent,
      User,
      TeacherProfile,
      StudentProfile,
      SupportMessage,
    ]),
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || "admin-secret-key-change-me",
      signOptions: { expiresIn: "24h" },
    }),
    forwardRef(() => SupportModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard],
  exports: [AdminService, AdminAuthGuard],
})
export class AdminModule {}
