import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { MaxBotService } from "./max-bot.service";

@ApiTags("max-bot")
@Controller("max-bot")
export class MaxBotController {
  constructor(private readonly maxBotService: MaxBotService) {}

  @Post("webhook")
  @ApiOperation({ summary: "MAX Bot webhook endpoint" })
  async webhook(@Body() update: any) {
    await this.maxBotService.handleWebhook(update);
    return { ok: true };
  }
}
