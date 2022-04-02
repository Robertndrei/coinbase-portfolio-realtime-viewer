import { Module } from '@nestjs/common';
import { WebSocketModule } from 'nestjs-websocket'
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CoinbaseFeedService } from './coinbase-feed.service';

@Module({
   imports: [
      WebSocketModule.forRootAsync({
         imports:[ConfigModule],
         useFactory: async (configService: ConfigService) => ({
            url: configService.get<string>('COINBASE_PRO_WSS_FEED_URL')
         }),
         inject: [ConfigService]
      })
   ],
   providers: [CoinbaseFeedService],
})
export class CoinbaseFeedModule {}
