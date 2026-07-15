import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  ForbiddenException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { PersonsService } from './persons.service';

@Injectable()
export class PersonsStrategy extends PassportStrategy(Strategy, 'persons') {
  constructor(
    private readonly configService: ConfigService,
    private readonly personsService: PersonsService,
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
      passReqToCallback: true,
    });
  }

  async validate({ person_id, type }) {
    if (!type || type !== 'access') {
      throw new UnauthorizedException('Invalid token or expired!');
    }
    const person = await this.personsService.findOne(person_id);
    if (!person.id) {
      throw new ForbiddenException('You have no rights!');
    }
    return person;
  }
}
