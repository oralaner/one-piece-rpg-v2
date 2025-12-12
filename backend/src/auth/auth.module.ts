import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';

@Module({
  imports: [
    // On enregistre la stratégie par défaut
    PassportModule.register({ defaultStrategy: 'jwt' }), 
  ],
  providers: [SupabaseStrategy],
  // 👇 TRÈS IMPORTANT : On exporte pour que GameModule puisse l'utiliser
  exports: [SupabaseStrategy, PassportModule], 
})
export class AuthModule {}