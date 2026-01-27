import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { json, urlencoded } from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const logger = new Logger('Bootstrap')
  
  // Увеличиваем лимит для body (для импорта больших ICS файлов)
  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ extended: true, limit: '10mb' }))
  
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: true,
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }))

  const config = new DocumentBuilder()
    .setTitle('Teach Mini App API')
    .setDescription('API для приложения репетитора')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Авторизация')
    .addTag('teachers', 'Функционал учителя')
    .addTag('students', 'Функционал ученика')
    .addTag('parents', 'Функционал родителя')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT || 3000
  // Слушаем на 0.0.0.0 чтобы быть доступным с других устройств в сети
  await app.listen(port, '0.0.0.0')
  
  logger.log(`🚀 Server running on port ${port} (accessible from network)`)
  logger.log(`📚 Swagger docs: http://localhost:${port}/docs`)
  logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
}
bootstrap()
