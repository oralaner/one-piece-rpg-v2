import { Controller, Post, Body, Get, Param, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/user.decorator';
import { GameService } from './game.service';

// DTOs imports
import { EquipItemDto } from './equip-item.dto';
import { UnequipItemDto } from './unequip-item.dto';
import { SellItemDto } from './sell-item.dto';
import { StartFightDto } from './start-fight.dto';
import { PlayTurnDto } from './play-turn.dto';
import { PlayCasinoDto } from './play-casino.dto';
import { CraftDto } from './craft.dto';
import { BuySkillDto } from './buy-skill.dto';
import { MarketSellDto } from './market-sell.dto';
import { MarketBuyDto } from './market-buy.dto';
import { CreateCrewDto } from './crew-create.dto';
import { CrewBankDto } from './crew-bank.dto';
import { JoinCrewDto, RecruitDto, KickDto, } from './crew-manage.dto';
import { UpdateCrewDto } from './crew-manage.dto';
import { GameGateway } from './game.gateway';
import { UseItemDto } from './use-item.dto';
import { OpenChestDto } from './crew-manage.dto'; 
import { StoryService } from './story.service';

class UserIdDto { userId: string; }


@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService, 
    private readonly gameGateway: GameGateway,
    private readonly storyService: StoryService 
  ) {}

  // -----------------------------------------------------
  // 🛡️ ROUTES SÉCURISÉES (Nécessitent un Token)
  // -----------------------------------------------------

  // 👑 ÉQUIPER UN TITRE
  @Post('titles/equip')
  async equipTitle(@Body() body: { userId: string, titre: string | null }) {
    return this.gameService.equipTitle(body.userId, body.titre);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('player/me')
  async getMyProfile(
    @User() userId: string,
    @User('pseudo') discordPseudo: string, 
    @User('avatarUrl') discordAvatar: string 
  ) {
    if (!userId) console.error("❌ [CONTROLLER] ERREUR : L'ID est undefined ou null !");
    
    const result = await this.gameService.getPlayerData(userId, discordPseudo, discordAvatar);
    
    if (!result) console.error("⚠️ [CONTROLLER] Service a renvoyé null/undefined");

    return result;
  }
  
  @Post('activity')
  @UseGuards(AuthGuard('jwt'))
  faireActivite(@User() userId: string) {
    return this.gameService.doActivity(userId);
  }
  
  @Post('stats/invest')
  async investStat(@Body() body: { userId: string, stat: string }) {
    return this.gameService.investStat(body as any);
  }

  @Post('buy')
  async buyItem(@Body() body: { userId: string, itemId: number, quantity: number }) {
    return this.gameService.buyItem({
      userId: body.userId,
      objetId: Number(body.itemId),
      quantite: Number(body.quantity || 1)
    });
  }

  @Post('equip')
  @UseGuards(AuthGuard('jwt'))
  equiper(@User() userId: string, @Body() dto: EquipItemDto) {
    dto.userId = userId;
    return this.gameService.equipItem(dto);
  }

  @Post('unequip')
  @UseGuards(AuthGuard('jwt'))
  desequiper(@User() userId: string, @Body() dto: UnequipItemDto) {
    dto.userId = userId;
    return this.gameService.unequipItem(dto);
  }

  @Post('sell')
  @UseGuards(AuthGuard('jwt'))
  vendre(@User() userId: string, @Body() dto: SellItemDto) {
    dto.userId = userId;
    return this.gameService.sellItem(dto);
  }

  @Post('craft')
  @UseGuards(AuthGuard('jwt'))
  crafter(@User() userId: string, @Body() dto: CraftDto) {
    dto.userId = userId;
    return this.gameService.craftItem(dto);
  }

  // --- COMBAT & JEUX ---

  @Post('fight/start')
  @UseGuards(AuthGuard('jwt'))
  lancerCombat(@User() userId: string, @Body() dto: StartFightDto) {
    dto.userId = userId;
    return this.gameService.startFight(dto);
  }

  @Post('fight/turn')
  @UseGuards(AuthGuard('jwt'))
  jouerTour(@User() userId: string, @Body() dto: PlayTurnDto) {
    dto.userId = userId;
    return this.gameService.playTurn(dto);
  }

  @Post('casino/play')
  @UseGuards(AuthGuard('jwt'))
  jouerCasino(@User() userId: string, @Body() dto: PlayCasinoDto) {
    dto.userId = userId;
    return this.gameService.playCasino(dto);
  }

  // --- COMPÉTENCES ---

  @Post('skill/buy') 
  @UseGuards(AuthGuard('jwt'))
  async acheterCompetence(@User() userId: string, @Body() dto: BuySkillDto) {
    dto.userId = userId;
    return this.gameService.buySkill(dto);
  }

  @Post('skill/equip')
  @UseGuards(AuthGuard('jwt'))
  async equipSkill(@User() userId: string, @Body() body: { skillId: number }) {
    return this.gameService.equipSkill({ 
        userId: userId, 
        skillId: body.skillId 
    });
  }

  // --- MARCHÉ ---

  @Post('market/sell')
  @UseGuards(AuthGuard('jwt'))
  vendreMarche(@User() userId: string, @Body() dto: MarketSellDto) {
    dto.userId = userId;
    return this.gameService.listOnMarket(dto);
  }

  @Post('market/buy')
  @UseGuards(AuthGuard('jwt'))
  acheterMarche(@User() userId: string, @Body() dto: MarketBuyDto) {
    dto.userId = userId;
    return this.gameService.buyFromMarket(dto);
  }

  // --- ÉQUIPAGE (CREW) ---

  @Get('crew/:userId')
  getCrewInfo(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gameService.getCrewInfo(userId);
  }

  @Post('crew/create')
  @UseGuards(AuthGuard('jwt'))
  creerEquipage(@User() userId: string, @Body() dto: CreateCrewDto) {
    dto.userId = userId;
    return this.gameService.createCrew(dto);
  }

  @Post('crew/leave')
  @UseGuards(AuthGuard('jwt'))
  quitterEquipage(@User() userId: string) {
    return this.gameService.leaveCrew(userId);
  }

  @Post('crew/bank')
  @UseGuards(AuthGuard('jwt'))
  banqueEquipage(@User() userId: string, @Body() dto: CrewBankDto) {
    dto.userId = userId;
    return this.gameService.manageBank(dto);
  }

  @Post('crew/join')
  @UseGuards(AuthGuard('jwt'))
  rejoindreEquipage(@User() userId: string, @Body() dto: JoinCrewDto) {
    dto.userId = userId;
    return this.gameService.joinCrew(dto);
  }

  @Post('crew/recruit')
  @UseGuards(AuthGuard('jwt'))
  gererRecrutement(@User() userId: string, @Body() dto: RecruitDto) {
    dto.userId = userId; 
    return this.gameService.manageApplication(dto);
  }

  @Post('crew/kick')
  @UseGuards(AuthGuard('jwt'))
  exclureMembre(@User() userId: string, @Body() dto: KickDto) {
    dto.userId = userId;
    return this.gameService.kickMember(dto);
  }

  @Post('crew/update')
  @UseGuards(AuthGuard('jwt'))
  updateCrew(@User() userId: string, @Body() dto: UpdateCrewDto) {
    dto.userId = userId;
    return this.gameService.updateCrewSettings(dto);
  }

  // --- RAIDS ---

  @Post('crew/raid/start')
  @UseGuards(AuthGuard('jwt'))
  startRaidPrep(@User() userId: string, @Body() body: { type: number }) {
    return this.gameService.startRaidPrep(userId, body.type);
  }

  @Post('crew/raid/join')
  async joinRaid(@Body() body: { userId: string }) {
    const result = await this.gameService.joinRaid(body.userId);
    const crewId = await this.gameService.getCrewIdFromUser(body.userId); 
    
    if (crewId) {
        this.gameGateway.server.to(`EQUIPAGE_${crewId}`).emit('crewUpdate');
    }
    
    return result;
  }

  @Post('crew/raid/check')
  checkRaid(@Body() body: { crewId: string }) {
    return this.gameService.checkRaidStatus(body.crewId);
  }

  @Post('crew/raid/force')
  @UseGuards(AuthGuard('jwt'))
  forceRaid(@User() userId: string) {
    return this.gameService.forceStartRaid(userId);
  }

  // --- GET DATA (Lecture) ---

  @Get('commerce')
  getCommerce() {
    return this.gameService.getCommerceData();
  }

  @Get('skills/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getSkills(@User() userId: string) {
    return this.gameService.getSkillsData(userId);
  }

  @Get('leaderboard/:type')
  getLeaderboard(@Param('type') type: string) {
    return this.gameService.getLeaderboard(type);
  }

  @Get('titles/:userId')
  getTitles(@Param('userId') userId: string) {
    return this.gameService.getTitles(userId);
  }

  @Get('chat/history/:canal')
  getChatHistory(@Param('canal') canal: string) {
    return this.gameService.getChatHistory(canal);
  }

  @Get('fight/current/:userId')
  @UseGuards(AuthGuard('jwt'))
  getCurrentFight(@User() userId: string) {
    return this.gameService.getCurrentFight(userId);
  }

  @Post('use')
  @UseGuards(AuthGuard('jwt'))
  utiliserObjet(@User() userId: string, @Body() dto: UseItemDto) {
    dto.userId = userId;
    return this.gameService.useItem(dto);
  }
  
  @Get('arena/:filter') 
  @UseGuards(AuthGuard('jwt'))
  getArena(@User() userId: string, @Param('filter') filter: string) {
    const safeFilter = filter === 'PVP' ? 'PVP' : 'PVE';
    return this.gameService.getArenaOpponents(userId, safeFilter);
  }

  @Post('chest/open')
  @UseGuards(AuthGuard('jwt'))
  openChest(@User() userId: string, @Body() dto: OpenChestDto) {
    dto.userId = userId; 
    return this.gameService.openChest(dto);
  }
  
  @Get('items/all')
  getAllItems() {
    return this.gameService.getAllItems();
  }

  @Post('combat/flee')
  @UseGuards(AuthGuard('jwt'))
  async fuirCombat(@User() userId: string, @Body() body: { combatId: string }) {
    return this.gameService.fleeCombat({ 
        userId, 
        combatId: body.combatId 
    });
  }

  @Post('activity/click')
  @UseGuards(AuthGuard('jwt'))
  async clickActivite(@User() userId: string) {
    return this.gameService.clickActivite({ userId });
  }

  @Post('expedition/collect')
  @UseGuards(AuthGuard('jwt'))
  async recolterExpedition(@User() userId: string) {
    return this.gameService.recolterExpedition({ userId });
  }

  @Post('faction/choose')
  @UseGuards(AuthGuard('jwt'))
  async chooseFaction(@User() userId: string, @Body() body: { faction: string }) {
    return this.gameService.chooseFaction(userId, body.faction);
  }

  @Post('ship/upgrade')
  @UseGuards(AuthGuard('jwt'))
  async upgradeShip(@User() userId: string) {
    return this.gameService.upgradeShip(userId);
  }

  @Get('meteo')
  async getMeteo() {
    return this.gameService.getMeteo();
  }

  @Get('quests/:userId')
  async getQuests(@Param('userId') userId: string) {
    return this.gameService.getDailyQuests(userId);
  }

  @Post('quests/claim')
  async claimQuest(@Body() body: { userId: string, questId: string }) {
    return this.gameService.claimQuestReward(body.userId, body.questId);
  }

  @Get('story/progress/:userId')
  async getStoryProgress(@Param('userId') userId: string) {
    return this.storyService.getCurrentProgress(userId);
  }

  @Post('story/validate')
  async validateStoryStep(@Body() body: { userId: string }) {
    return this.storyService.validateStep(body.userId);
  }

  @Get('destinations/:userId')
  async getDestinations(@Param('userId') userId: string) {
    return this.storyService.getDestinationsWithStatus(userId);
  }

  @Post('combat/start-story')
  async startStoryFight(@Body() body: { userId: string, targetName: string }) {
    return this.gameService.startStoryFight(body.userId, body.targetName);
  }

  @Get('combat/current/:userId')
  async getCurrentFightStory(@Param('userId') userId: string) {
    return this.gameService.getCurrentFight(userId);
  }

  @Post('debug/reset')
  async debugReset(@Body() body: { userId: string }) {
    return this.gameService.debugResetPlayer(body.userId);
  }

  // --- 🛠️ ROUTES ADMIN ---
  @Get('admin/players')
  @UseGuards(AuthGuard('jwt'))
  async getAdminPlayers(@User() userId: string) {
      return this.gameService.getAllPlayers(userId);
  }

  @Post('admin/action')
  @UseGuards(AuthGuard('jwt'))
  async adminAction(@User() userId: string, @Body() body: any) {
      return this.gameService.adminAction(userId, body.targetId, body.action, body.amount);
  }

  @Post('admin/broadcast')
  @UseGuards(AuthGuard('jwt'))
  async adminBroadcast(@User() userId: string, @Body() body: any) {
      return this.gameService.adminBroadcast(userId, body.titre, body.message);
  }

  // --- 🔔 ROUTES NOTIFICATIONS ---
  @Get('notifications')
  @UseGuards(AuthGuard('jwt'))
  async getNotifications(@User() userId: string) {
      return this.gameService.getMyNotifications(userId);
  }

  @Post('notifications/:id/read')
  @UseGuards(AuthGuard('jwt'))
  async readNotification(@User() userId: string, @Param('id') id: string) {
      return this.gameService.readNotification(userId, id);
  }

  // --- VOYAGE V2 (Temps Réel) ---

  @Get('map')
  @UseGuards(AuthGuard('jwt'))
  getMap(@User() userId: string) {
    return this.gameService.getMapData(userId);
  }

  @Post('map/travel')
  @UseGuards(AuthGuard('jwt'))
  startTravel(@User() userId: string, @Body() body: { destinationId: number }) {
    return this.gameService.startTravel(userId, Number(body.destinationId));
  }

  @Get('map/status')
  @UseGuards(AuthGuard('jwt'))
  checkTravel(@User() userId: string) {
    return this.gameService.checkTravelArrival(userId);
  }
}