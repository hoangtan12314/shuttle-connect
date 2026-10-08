import { Module } from '@nestjs/common';
import { SessionModule, CourtModule, RequestModule, UserModule } from './infrastructure/ioc';

@Module({
  imports: [SessionModule, CourtModule, RequestModule, UserModule],
})
export class AppModule {}
