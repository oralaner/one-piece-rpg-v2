import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// 👇👇👇 DÉBUT DU CORRECTIF À AJOUTER 👇👇👇
// Indispensable pour que Prisma ne fasse pas planter l'app avec les BigInt (Berrys, XP, etc.)
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
// 👆👆👆 FIN DU CORRECTIF 👆👆👆

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ta configuration CORS (qu'on a faite tout à l'heure)
  app.enableCors({
    origin: [
        'https://one-piece-rpg-v2.vercel.app', 
        'http://localhost:3000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();