import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IMatch } from './interfaces/match.interface';
import { Model } from 'mongoose';
import { Ranking } from './interfaces/ranking.schema';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy.provider';
import { ICategory } from './interfaces/category.interface';
import { EventName } from 'src/rankings/event-name.enum';

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);

  constructor(
    private readonly clientSmartRanking: ClientProxySmartRanking,
    @InjectModel('Ranking') private readonly rankingModel: Model<Ranking>,
  ) {}

  private readonly clientAdminBackend: ClientProxy =
    this.clientSmartRanking.getClientProxyInstance('admin');

  async processMatch(matchId: string, match: IMatch): Promise<void> {
    this.logger.log(`Processing match ${matchId}`);
    this.logger.log(`Match: ${JSON.stringify(match, null, 2)}`);

    try {
      const category: ICategory = await this.clientAdminBackend
        .send('get-categories', match.category)
        .toPromise();

      await Promise.all(
        match.players.map((player) => {
          const ranking: Ranking = new this.rankingModel();

          ranking.category = match.category;
          ranking.challenge = match.challenge;
          ranking.match = matchId;
          ranking.player = player;

          const event =
            player === match.winner
              ? category.events.find(
                  (event) => event.name === EventName.VICTORY,
                )
              : category.events.find(
                  (event) => event.name === EventName.DEFEAT,
                );

          ranking.event = event.name;
          ranking.score = event.value;
          ranking.operation = event.operation;

          this.logger.log(`Adding ranking ${JSON.stringify(ranking, null, 2)}`);

          ranking.save();
        }),
      );
    } catch (error) {
      this.logger.error(`error: ${error}`);
      throw new RpcException(error.message);
    }
  }
}
