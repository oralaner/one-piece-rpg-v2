import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si on demande un champ précis (ex: @User('pseudo'))
    if (data) {
        return user ? user[data] : null;
    }

    // Sinon, par défaut, on renvoie l'ID (pour ne pas casser le reste du code)
    return user ? user.userId : null; 
  },
);