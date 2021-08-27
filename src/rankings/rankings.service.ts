import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IMatch } from './interfaces/match.interface';
import { Model } from 'mongoose';
import { Ranking } from './interfaces/ranking.schema';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy.provider';
import { ICategory } from './interfaces/category.interface';
import { EventName } from 'src/rankings/event-name.enum';
import { IRankingResponse } from './interfaces/ranking-response.interface';
import { HelperFunctions } from 'src/common/helpers';

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);

  constructor(
    private readonly clientSmartRanking: ClientProxySmartRanking,
    @InjectModel('Ranking') private readonly rankingModel: Model<Ranking>,
    private readonly helper: HelperFunctions,
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

          /**
           * set the date of the match
           */
          ranking.dateTimeChallenge = this.helper.convertLocaleStringToDate(
            match.dateTimeChallenge,
          );

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

  async getRankings(
    categoryId: string,
    dateRef: string,
  ): Promise<IRankingResponse[] | IRankingResponse> {
    this.logger.log(
      `Getting rankings for ${categoryId} and dateRef: ${dateRef}`,
    );

    try {
      /**
       * If not provided it should be the current date
       */
      if (!dateRef) {
        dateRef = new Date().toLocaleString('en-US', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'short',
        });
        this.logger.log(`dateRef: ${dateRef}`);
      }

      /**
       * Get proccesed matches filtred by category
       */
      const rankings: Ranking[] = await this.rankingModel
        .find({
          category: categoryId,
          dateTimeChallenge: { $lte: new Date(`${dateRef} 23:59:59.999`) },
        })
        .exec();

      const responses = rankings.reduce((rankings, ranking) => {
        /**
         * Group the rankings by player
         * and summarize the score and events (matches history)
         */
        if (!rankings[ranking.player]) {
          rankings[ranking.player] = {} as IRankingResponse;
          rankings[ranking.player].player = ranking.player;
          rankings[ranking.player].score = 0;
          rankings[ranking.player].matchesHistory = {
            wins: 0,
            losses: 0,
            matches: 0,
          };
        }

        rankings[ranking.player].score += parseInt(
          `${ranking.operation}${ranking.score}`,
        );
        rankings[ranking.player].matchesHistory.wins +=
          ranking.event === EventName.VICTORY ? 1 : 0;
        rankings[ranking.player].matchesHistory.losses +=
          ranking.event === EventName.DEFEAT ? 1 : 0;
        rankings[ranking.player].matchesHistory.matches += 1;

        return rankings;
      }, {});

      const rankingsResponses: IRankingResponse[] = Object.values(responses);

      /**
       * Sort the player's rankings by score
       * and add the rank for each player
       */
      return rankingsResponses
        .sort((a, b) => b.score - a.score)
        .map((response) => ({
          ...response,
          rank: rankingsResponses.indexOf(response) + 1,
        }));
    } catch (error) {
      this.logger.error(`error: ${error}`);
      throw new RpcException(error.message);
    }
  }
}