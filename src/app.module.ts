import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';

import { ClientSocketModule } from './client-socket/client-socket.module';
import { CoinbaseFeedModule } from './coinbase-feed/coinbase-feed.module';
import { CoinbaseFeedService } from './coinbase-feed/coinbase-feed.service';

@Module({
   imports: [
      ClientSocketModule, 
      CoinbaseFeedModule, 
      ConfigModule.forRoot({ isGlobal: true })
   ],
   controllers: [AppController],
   providers: [CoinbaseFeedService],
})
export class AppModule {}
