import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

@Controller()
class TestController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'ChargeLox Backend',
    };
  }
}

@Module({
  controllers: [TestController],
})
class TestAppModule {}

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    return request(httpServer)
      .get('/health')
      .expect(200)
      .expect(({ body }: { body: { status: string } }) => {
        expect(body.status).toBe('ok');
      });
  });
});
