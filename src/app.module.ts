import { Module } from '@nestjs/common';
import { RankingsModule } from './rankings/rankings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/database';

const configService = new ConfigService();

@Module({
  imports: [
    RankingsModule,
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    MongooseModule.forRoot(configService.get<string>('DATABASE_URL'), config),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
