import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // On récupère le token dans le header "Authorization: Bearer ..."
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // ⚠️ Utilise la même clé secrète que dans ton .env ou auth.module.ts
      secretOrKey: process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'secretKey', 
    });
  }

  async validate(payload: any) {
    // Ce que tu retournes ici sera accessible via `req.user`
    return { userId: payload.sub, email: payload.email };
  }
}