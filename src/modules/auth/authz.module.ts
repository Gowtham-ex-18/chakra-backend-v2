import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../../common/guards/auth.guard';

import { AuthzController } from './authz.controller';
import { AuthzService } from './authz.service';

@Module({
  controllers: [AuthzController],
  providers: [
    AuthzService, {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
  ],
})
export class AuthzModule { }
