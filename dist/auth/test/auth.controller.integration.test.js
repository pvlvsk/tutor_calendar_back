"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const auth_controller_1 = require("../auth.controller");
const auth_service_1 = require("../auth.service");
describe('AuthController (HTTP integration)', () => {
    let app;
    let mockAuthService;
    beforeEach(async () => {
        mockAuthService = {
            init: jest.fn().mockResolvedValue({
                status: 'new_user',
                user: null,
            }),
            register: jest.fn().mockResolvedValue({
                status: 'registered',
                access_token: 'mock_jwt_token',
                user: {
                    id: '123',
                    telegramId: 123456789,
                    role: 'teacher',
                },
            }),
        };
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [auth_controller_1.AuthController],
            providers: [
                {
                    provide: auth_service_1.AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe());
        await app.init();
    });
    afterEach(async () => {
        await app.close();
    });
    describe('POST /auth/init', () => {
        it('должен принять валидный initData и вернуть статус', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/init')
                .send({ initData: 'test' })
                .expect(201);
            expect(response.body).toEqual({
                status: 'new_user',
                user: null,
            });
            expect(mockAuthService.init).toHaveBeenCalledWith('test');
        });
        it('должен вернуть 400 при отсутствии initData', async () => {
            await request(app.getHttpServer())
                .post('/auth/init')
                .send({})
                .expect(400);
        });
        it('должен вернуть 400 при невалидном типе initData', async () => {
            await request(app.getHttpServer())
                .post('/auth/init')
                .send({ initData: 123 })
                .expect(400);
        });
    });
    describe('POST /auth/register', () => {
        it('должен зарегистрировать нового пользователя', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ initData: 'test', role: 'teacher' })
                .expect(201);
            expect(response.body.status).toBe('registered');
            expect(response.body.access_token).toBeDefined();
            expect(mockAuthService.register).toHaveBeenCalledWith('test', 'teacher');
        });
        it('должен вернуть 400 при невалидной роли', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ initData: 'test', role: 'invalid_role' })
                .expect(400);
        });
        it('должен принять роль student', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ initData: 'test', role: 'student' })
                .expect(201);
            expect(mockAuthService.register).toHaveBeenCalledWith('test', 'student');
        });
        it('должен принять роль parent', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ initData: 'test', role: 'parent' })
                .expect(201);
            expect(mockAuthService.register).toHaveBeenCalledWith('test', 'parent');
        });
    });
});
//# sourceMappingURL=auth.controller.integration.test.js.map