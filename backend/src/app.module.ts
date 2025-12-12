import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { GameModule } from './game/game.module';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // 👇 CONFIGURATION REDIS (Cache)
    CacheModule.register({
      isGlobal: true, // Le cache est dispo partout
      store: redisStore,
      host: 'localhost', // Docker tourne sur ta machine
      port: 6379,
      ttl: 600, // Durée de vie par défaut : 10 minutes (en secondes ici)
    }),
    
    AuthModule, 
    GameModule
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}