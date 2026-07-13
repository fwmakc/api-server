import {
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Type,
} from '@nestjs/common';
import { BaseEntity } from 'typeorm';
import { RelationsDto } from '@src/common/dto/relations.dto';
import { CommonService } from '@src/common/common.service';
import { CommonDto } from '@src/common/common.dto';
import { ProtectedController } from '@src/common/controller/protected.controller';
import { AuthDto } from '@src/auth/auth.dto';
import { Auth, Self } from '@src/auth/auth.decorator';
import { Data, Doc } from '@src/common/common.decorator';
import { BindDto } from '../dto/bind.dto';

export const PrivateController = <T extends Type<unknown>>(
  name: string,
  classDto,
  classEntity: T,
  authTable = '',
  authField = 'id',
) => {
  class BasePrivateController<
    Dto extends CommonDto,
    Entity extends BaseEntity,
    Service extends CommonService<Dto, Entity>,
  > extends ProtectedController(
    name,
    classDto,
    classEntity,
    authTable,
    authField,
  )<Dto, Entity, Service> {
    readonly service: Service;

    @Auth()
    @Get('find')
    @Doc('find', classDto)
    async find(
      @Data('search') search: object,
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('limit') limit: number = undefined,
      @Data('offset') offset: number = undefined,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() auth: AuthDto,
    ): Promise<Entity[]> {
      const bind: BindDto = this.service.bind(auth, {
        name: authTable,
        key: authField,
        allow: auth?.isSuperuser,
      });
      return await this.service.find(
        {
          search,
          select,
          where,
          order,
          limit,
          offset,
          relations,
        },
        bind,
      );
    }

    @Auth()
    @Get('find/first')
    @Doc('findFirst', classDto)
    async findFirst(
      @Data('search') search: object,
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() auth: AuthDto,
    ): Promise<Entity> {
      const bind: BindDto = this.service.bind(auth, {
        name: authTable,
        key: authField,
        allow: auth?.isSuperuser,
      });
      return await this.service.findFirst(
        {
          search,
          select,
          where,
          order,
          relations,
        },
        bind,
      );
    }

    @Auth()
    @Get('find/many/:ids')
    @Doc('findMany', classDto)
    async findMany(
      @Param('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
      ids: Array<number>,
      @Data('select') select: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() auth: AuthDto,
    ): Promise<Entity[]> {
      const bind: BindDto = this.service.bind(auth, {
        name: authTable,
        key: authField,
        allow: auth?.isSuperuser,
      });
      const result = await this.service.findMany(
        {
          ids,
          select,
          relations,
        },
        bind,
      );
      if (!result) {
        throw new NotFoundException('Entrie not found');
      }
      return result;
    }

    @Auth()
    @Get('find/:id')
    @Doc('findOne', classDto)
    async findOne(
      @Param('id', ParseIntPipe) id: number,
      @Data('select') select: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() auth: AuthDto,
    ): Promise<Entity> {
      const bind: BindDto = this.service.bind(auth, {
        name: authTable,
        key: authField,
        allow: auth?.isSuperuser,
      });
      const result = await this.service.findOne(
        {
          id: Number(id),
          select,
          relations,
        },
        bind,
      );
      if (!result) {
        throw new NotFoundException('Entrie not found');
      }
      return result;
    }

    @Auth()
    @Get('self')
    @Doc('self', classDto)
    async self(
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() auth: AuthDto,
    ): Promise<Entity[]> {
      const bind: BindDto = this.service.bind(auth, {
        name: authTable,
        key: authField,
        allow: false,
      });
      return await this.service.find(
        {
          where,
          select,
          order,
          relations,
        },
        bind,
      );
    }

    @Auth()
    @Get('count')
    @Doc('count', classDto)
    async count(
      @Data('where') where: object,
      @Data('limit') limit: number = undefined,
      @Data('offset') offset: number = undefined,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() auth: AuthDto,
    ): Promise<number> {
      const bind: BindDto = this.service.bind(auth, {
        name: authTable,
        key: authField,
        allow: auth?.isSuperuser,
      });
      return await this.service.count(
        {
          where,
          limit,
          offset,
          relations,
        },
        bind,
      );
    }
  }
  return BasePrivateController;
};
