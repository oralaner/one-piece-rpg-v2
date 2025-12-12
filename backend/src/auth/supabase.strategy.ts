import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// 👇 AJOUT DE 'jwt' EN 2ÈME ARGUMENT
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
    return { userId: payload.sub, email: payload.email };
  }
}