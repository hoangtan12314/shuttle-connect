import { Module } from '@nestjs/common';
import { SessionModule } from './infrastructure/ioc';

@Module({
  imports: [SessionModule],
})
export class AppModule {}
