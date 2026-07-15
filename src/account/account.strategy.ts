import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  ForbiddenException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthClientService } from '@src/auth-client/auth-client.service';

@Injectable()
export class AccountStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authClientService: AuthClientService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: !configService.get('JWT_EXPIRES'),
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: `${configService.get(
          'AUTH_SERVER_URL',
        )}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate({ id, type, key }) {
    if (!type || type !== 'access') {
      throw new UnauthorizedException('Invalid token or expired!');
    }
    const account = await this.authClientService.getAccountInfo(id);
    if (!account || (!account.isActivated && !key)) {
      throw new ForbiddenException('You have no rights!');
    }
    return account;
  }
}
