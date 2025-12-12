import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { PrismaService } from '../prisma.service';
import { PlayTurnDto } from './play-turn.dto'; // Import du DTO combat

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://one-piece-rpg-v2.vercel.app', // Ton URL Vercel EXACTE (sans slash à la fin)
      process.env.FRONTEND_URL // Pour utiliser la variable d'env Railway
    ],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly prisma: PrismaService
  ) {}

  handleConnection(client: Socket) {
    // console.log(`🔌 Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`❌ Client déconnecté`);
  }

  // --- GESTION DES SALLES (ROOMS) ---

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.join(data.room);
    console.log(`Client ${client.id} rejoint ${data.room}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.leave(data.room);
  }

  // --- TCHAT (Déjà fait) ---
  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: any) {
    const savedMessage = await this.prisma.messages.create({
      data: {
        joueur_id: data.userId,
        pseudo: data.pseudo,
        contenu: data.contenu,
        canal: data.room,
        faction: data.faction || 'Pirate',
        date_envoi: new Date(),
      },
    });
    this.server.to(data.room).emit('newMessage', savedMessage);
  }

  // --- COMBAT TEMPS RÉEL ⚔️ ---

  @SubscribeMessage('joinCombat')
  handleJoinCombat(@ConnectedSocket() client: Socket, @MessageBody() data: { combatId: string }) {
    client.join(`combat_${data.combatId}`);
  }

  @SubscribeMessage('combatAction')
  async handleCombatAction(@MessageBody() dto: PlayTurnDto) {
    try {
      // 1. On exécute la logique du tour (la même qu'avant)
      const result = await this.gameService.playTurn(dto);

      // 2. On diffuse le résultat à TOUS les participants du combat (Moi + Adversaire)
      this.server.to(`combat_${dto.combatId}`).emit('combatUpdate', result);
      
    } catch (e) {
      // Si erreur, on l'envoie juste à celui qui a cliqué
      // (Il faudra gérer l'écoute de 'error' côté front)
      console.error(e);
    }
  }

  // --- RAID TEMPS RÉEL 🏴‍☠️ ---
  
  // Cette méthode permet au Service d'envoyer des notifs (ex: quand quelqu'un rejoint le raid via HTTP)
  // On l'appellera depuis GameService
  emitCrewUpdate(crewId: string) {
    this.server.to(`EQUIPAGE_${crewId}`).emit('crewUpdate');
  }
}