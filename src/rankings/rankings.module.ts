import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { ProxyrmqModule } from 'src/proxyrmq/proxyrmq.module';
@Module({
  imports: [
    ProxyrmqModule,
  ],
  providers: [RankingsService],
  controllers: [RankingsController],
})
export class RankingsModule {}
