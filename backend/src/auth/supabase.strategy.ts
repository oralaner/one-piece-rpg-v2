import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') { 
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET || '', 
    });
  }

  async validate(payload: any) {
    // 🔍 INSPECTION DU TOKEN
    // Supabase stocke les infos Discord dans "user_metadata"
    const metadata = payload.user_metadata || {};

    return { 
        userId: payload.sub, 
        email: payload.email,
        // On récupère le pseudo (souvent 'full_name' ou 'name' pour Discord)
        pseudo: metadata.full_name || metadata.name || metadata.user_name || `Pirate_${payload.sub.substring(0,5)}`,
        // On récupère l'avatar
        avatarUrl: metadata.avatar_url || metadata.picture || null
    };
  }
}