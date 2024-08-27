import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors();
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(8000);
}
bootstrap();
