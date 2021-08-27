import { Controller, Logger, PayloadTooLargeException } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { IMatch } from './interfaces/match.interface';
import { IRankingResponse } from './interfaces/ranking-response.interface';
import { RankingsService } from './rankings.service';

const ackErrors: string[] = ['E1100', '_E404'];

@Controller()
export class RankingsController {
  constructor(private readonly rankingService: RankingsService) {}

  private readonly logger = new Logger(RankingsController.name);

  @EventPattern('proccess-match')
  async processMatch(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(`data:${JSON.stringify(data, null, 2)}`);
      const matchId: string = data.matchId;
      const match: IMatch = data.match;

      await this.rankingService.processMatch(matchId, match);
      await channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(error.message);

      if (ackErrors.some((errorCode) => error.message.includes(errorCode))) {
        await channel.ack(originalMessage);
      }
    }
  }

  @MessagePattern('get-rankings')
  async getRankings(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ): Promise<IRankingResponse[] | IRankingResponse> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(`get Ranking with data:${JSON.stringify(data, null, 2)}`);
      const { categoryId, dateRef } = data;

      const rankingResponse = await this.rankingService.getRankings(
        categoryId,
        dateRef,
      );

      return rankingResponse;
    } finally {
      await channel.ack(originalMessage);
    }
  }
}
