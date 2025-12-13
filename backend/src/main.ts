import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 👇 CONFIGURATION CORS PERMISSIVE
app.enableCors({
    // 👇 METS TON URL VERCEL EXACTE ICI (sans slash à la fin)
    origin: [
      'https://one-piece-rpg-v2.vercel.app', 
      'http://localhost:3000' // Garde localhost pour tes tests chez toi
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();