import { ConfigService } from '@nestjs/config';

import { CoinbasePro } from 'coinbase-pro-node';

import { Currencies, Currency } from './models/currencies';
import { Portfolio, Coin } from './models/portfolio';

import { ClientSocketGateway } from './client-socket/client-socket.gateway';
import { CoinbaseFeedService } from './coinbase-feed/coinbase-feed.service';

export class Coinbase {

   /**
    * Coinbase PRO client
    */
   private _client: CoinbasePro;

   /**
    * Coinbase service that gets price updates
    */
   private _coinbaseFeedService: CoinbaseFeedService;

   /**
    * Coinbase PRO client configuration
    */
   authPro = {
      apiKey: this.configService.get<string>('COINBASE_PRO_API_KEY'),
      apiSecret: this.configService.get<string>('COINBASE_PRO_API_SECRET'),
      passphrase: this.configService.get<string>('COINBASE_PRO_PASSPHRASE'),
      useSandbox: false
   };

   constructor( 
      private configService: ConfigService,
      private readonly currencies: Currencies,
      private readonly portfolio: Portfolio,
      private readonly clientSocketGateway: ClientSocketGateway,
      private readonly coinbaseFeedService: CoinbaseFeedService
   ) {
      this._client = new CoinbasePro( this.authPro );

      this.coinbaseFeedService.connected.subscribe(connected => {
         if ( connected ) {
            this.init();
         }
      })

      /**
       * Every price change
       */
      this.coinbaseFeedService.ticker.subscribe(ticker => {
         if ( ticker !== undefined ) {
            this.currencies.update(new Currency(
               ticker.product_id,
               Number(ticker.price),
               Number(ticker.open_24h),
               Number(ticker.volume_24h),
               Number(ticker.low_24h),
               Number(ticker.high_24h),
               Number(ticker.volume_30d),
               Number(ticker.best_bid),
               Number(ticker.best_ask)
            ));

            this.portfolio.calculateWorth();

            if ( this.configService.get<string>('TERMINAL_OUTPUT') === "true" ||
                 this.configService.get<string>('TERMINAL_OUTPUT') === "TRUE" ) {
               this.portfolio.print();
            }

            this.clientSocketGateway.updateClient(this.portfolio);
         }
      })
   }

   /**
    * Class initializer. Gets user portfolio every 10 seconds
    */
   async init() {
      await this.requestPortfolio();
      this.coinbaseFeedService.subscribe( this.portfolio.getTickersId() );

      setInterval(async () => {
         await this.requestPortfolio();
         this.coinbaseFeedService.subscribe( this.portfolio.getTickersId() );
      }, 10000);
   }

   /**
    * Get user portfolio from Coinbase PRO platform
    */
   private async requestPortfolio() {
      try {
         let accounts = await this._client.rest.account.listAccounts();
         
         accounts
            .filter(account => Number(account.balance) !== 0)
            .forEach(account => {

               this.portfolio.update(
                  new Coin(
                     account.id, 
                     account.currency, 
                     Number(account.balance)
                  )
               )
         })

         this.portfolio.calculateWorth();
      } catch(e) {}
   }
}
