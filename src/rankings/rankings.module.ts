import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { RankingSchema } from './interfaces/ranking.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ProxyrmqModule } from 'src/proxyrmq/proxyrmq.module';
import { HelperFunctions } from 'src/common/helpers';
@Module({
  imports: [
    MongooseModule.forFeature([{ schema: RankingSchema, name: 'Ranking' }]),
    ProxyrmqModule,
  ],
  providers: [RankingsService, HelperFunctions],
  controllers: [RankingsController],
})
export class RankingsModule {}
