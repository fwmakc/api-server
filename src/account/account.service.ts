import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { CommonService } from '@src/common/common.service';
import { RelationsDto } from '@src/common/dto/relations.dto';
import { AccountDto } from './account.dto';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountService extends CommonService<AccountDto, AccountEntity> {
  constructor(
    @InjectRepository(AccountEntity)
    protected readonly repository: Repository<AccountEntity>,
  ) {
    super();
  }
}
