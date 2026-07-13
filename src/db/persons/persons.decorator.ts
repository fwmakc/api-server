import {
  UseGuards,
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { JwtPersonsGuard } from './guard/jwt.persons.guard';

export const Person = () => {
  return applyDecorators(UseGuards(JwtPersonsGuard));
};

export const SelfPerson = createParamDecorator(
  async (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
