import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// --- BIGINT FIX (On garde ça, c'est vital) ---
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. GESTION DES CORS (Qui a le droit de parler au backend ?)
  // En prod, on veut être précis pour que les cookies/auth fonctionnent bien.
  app.enableCors({
    origin: [
      'http://localhost:3000',      // Ton Frontend local
      'http://localhost:3001',      // Au cas où
      process.env.FRONTEND_URL,     // L'URL Vercel qu'on définira dans les variables d'environnement
      // Tu peux aussi ajouter l'URL en dur si tu la connais déjà :
      // 'https://ton-projet-v2.vercel.app' 
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Important pour les sessions/cookies/sockets
  });

  // 2. PORT DYNAMIQUE (Crucial pour Railway !)
  // Railway te donne un port aléatoire dans la variable process.env.PORT
  // Si on force 3001, l'app va crasher en ligne.
  const port = process.env.PORT || 3001;

  // 3. ÉCOUTE SUR 0.0.0.0
  // '0.0.0.0' est obligatoire pour que Docker/Railway expose l'app vers l'extérieur.
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend lancé sur le port : ${port}`);
}
bootstrap();