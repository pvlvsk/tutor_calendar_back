# Тестирование Backend

Документация по тестированию NestJS backend.

---

## Быстрый старт

```bash
cd backend
npm run test
```

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm run test` | Запустить все тесты один раз |
| `npm run test:watch` | Запустить в watch-режиме (перезапуск при изменениях) |
| `npm run test:cov` | Запустить с отчётом о покрытии кода |
| `npm run test:debug` | Запустить с возможностью отладки |

---

## Билд с тестами

| Команда | Описание |
|---------|----------|
| `npm run build` | Билд с тестами (тесты должны пройти) |
| `npm run build:no-tests` | Билд без тестов |

---

## Конфигурация

**Файл:** `jest.config.js`

- **Фреймворк:** Jest + ts-jest
- **Среда:** Node.js
- **Паттерн файлов:** `*.test.ts`, `*.spec.ts`
- **Директория тестов:** `src/**/test/`

---

## Структура тестов

### Принцип: папка `test/` рядом с компонентом

```
src/
├── shared/
│   ├── utils.ts                    ← Исходный код
│   ├── debt.service.ts
│   ├── stats.service.ts
│   └── test/
│       ├── utils-stats.test.ts     ← Unit тесты статистики
│       ├── utils-format.test.ts    ← Unit тесты форматирования
│       ├── utils-debt.test.ts      ← Unit тесты долгов
│       ├── utils-url.test.ts       ← Unit тесты URL
│       ├── debt.service.test.ts    ← Unit тесты DebtService
│       ├── stats.service.test.ts   ← Unit тесты StatsService
│       └── achievements.service.test.ts
├── auth/
│   ├── auth.controller.ts
│   ├── telegram.service.ts
│   └── test/
│       ├── telegram.service.test.ts           ← Unit тесты валидации
│       └── auth.controller.integration.test.ts ← Интеграционные (supertest)
└── health/
    ├── health.controller.ts
    └── test/
        └── health.controller.test.ts  ← Интеграционные тесты
```

### Правила именования

- **Один файл тестов = один логический блок функций**
- **Имя файла отражает тестируемый модуль:** `<module>-<aspect>.test.ts`
- **Примеры:**
  - `utils-stats.test.ts` — функции статистики из `utils.ts`
  - `utils-format.test.ts` — функции форматирования из `utils.ts`
  - `auth.service.test.ts` — AuthService

### Рекомендации по размеру файлов

- **Максимум ~100-150 строк** на файл
- **~5-15 тестов** на файл
- Если файл вырастает — разбей по логическим блокам

---

## Примеры запуска

```bash
# Запустить все тесты
npm run test

# Запустить тесты shared
npx jest src/shared/test/

# Запустить конкретный файл
npx jest src/shared/test/utils-stats.test.ts

# Запустить тесты по паттерну имени
npx jest --testNamePattern="calculateAttendanceRate"
```

---

## Написание тестов

### Связь тест ↔ код

В начале каждого тестового файла добавляйте JSDoc:

```typescript
/**
 * @file utils-stats.test.ts
 * @description Тесты для функций статистики
 * @relatedTo ../utils.ts
 *
 * Покрывает: calculateAttendanceRate
 */
```

### Тестирование утилит

```typescript
import { calculateAttendanceRate } from '../utils';

describe('calculateAttendanceRate', () => {
  it('должен вычислить процент посещаемости', () => {
    expect(calculateAttendanceRate(8, 10)).toBe(80);
  });

  it('должен вернуть 0 при total = 0', () => {
    expect(calculateAttendanceRate(0, 0)).toBe(0);
  });
});
```

### Тестирование NestJS сервисов

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TeacherService } from '../teacher.service';

describe('TeacherService', () => {
  let service: TeacherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeacherService],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
  });

  describe('createLesson', () => {
    it('должен создать урок', async () => {
      const data = { subjectId: '...', startAt: '...' };
      const result = await service.createLesson(data);
      expect(result).toBeDefined();
    });
  });
});
```

### Моки репозиториев

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    TeacherService,
    {
      provide: getRepositoryToken(Lesson),
      useValue: mockRepository,
    },
  ],
}).compile();
```

---

## Интеграционные тесты (HTTP)

### Использование Supertest

Для тестирования HTTP эндпоинтов используем `supertest`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      init: jest.fn().mockResolvedValue({ status: 'new_user' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/init', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/init')
      .send({ initData: 'test' })
      .expect(201);

    expect(response.body.status).toBe('new_user');
  });
});
```

### Что тестируют интеграционные тесты

- **HTTP методы и роуты** — правильный статус ответа
- **Валидация DTO** — 400 при невалидных данных
- **Middleware и pipes** — ValidationPipe, Guards
- **Взаимодействие controller ↔ service**

---

## Полезные ссылки

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
