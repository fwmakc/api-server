import { Repository } from 'typeorm';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from '@core/common';
import { RelationsDto } from '@core/common';
import { ClientsDto } from './clients.dto';
import { ClientsEntity } from './clients.entity';

@Injectable()
export class ClientsService extends CommonService<ClientsDto, ClientsEntity> {
  constructor(
    @InjectRepository(ClientsEntity)
    protected readonly repository: Repository<ClientsEntity>,
  ) {
    super();
  }

  async clientsVerify(client_id: string, client_secret: string): Promise<any> {
    let client;
    try {
      client = await this.repository.findOne({
        where: {
          client_id,
          client_secret,
        },
      });
    } catch (e) {
      console.error('Clients verify error', e);
      throw new BadRequestException(e.message, {
        cause: new Error(),
        description: 'invalid_request',
      });
    }
    if (!client) {
      throw new BadRequestException(
        'Client is unknown, not registered, or parameters are set incorrectly',
        { cause: new Error(), description: 'invalid_client' },
      );
    }
    if (!client.client_id || !client.client_secret) {
      throw new BadRequestException(
        'Client is not authorized or has the rights to this request',
        { cause: new Error(), description: 'unauthorized_client' },
      );
    }
    return client;
  }

  async clientsGetWhere(
    where: object,
    relations: Array<RelationsDto> = undefined,
  ): Promise<ClientsEntity> {
    return await this.repository.findOne({
      relations: relations?.map((i) => i.name),
      where,
    });
  }
}
