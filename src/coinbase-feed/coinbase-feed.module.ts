import { Module } from '@nestjs/common';
import { CoinbaseFeedService } from './coinbase-feed.service';

@Module({
   imports: [],
   providers: [CoinbaseFeedService],
})
export class CoinbaseFeedModule {}
