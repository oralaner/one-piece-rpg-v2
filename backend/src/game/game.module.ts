import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GameGateway } from './game.gateway';
import { StoryService } from './story.service';

@Module({
  imports: [AuthModule, GameModule], // <--- AJOUTE ÇA ICI !
  controllers: [GameController],
  providers: [GameService, PrismaService, GameGateway, StoryService],
  exports: [GameService, StoryService]
})
export class GameModule {}