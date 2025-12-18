import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt'; // Optionnel mais recommandé
import { SupabaseStrategy } from './supabase.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // On définit la stratégie par défaut sur 'jwt'
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // (Optionnel) Configuration JWT si besoin de signer des tokens manuellement plus tard
    JwtModule.register({
      secret: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [
    SupabaseStrategy, 
    JwtStrategy // 👈 INDISPENSABLE : C'est ce qui active le Guard 'jwt'
  ],
  exports: [
    SupabaseStrategy, 
    JwtStrategy, 
    PassportModule,
    JwtModule
  ], 
})
export class AuthModule {}