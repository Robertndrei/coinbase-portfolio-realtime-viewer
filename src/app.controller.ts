import { Controller, Get, Render } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Currencies } from './models/currencies';
import { Portfolio } from './models/portfolio';
import { Coinbase } from './coinbase';

import { ClientSocketGateway } from './client-socket/client-socket.gateway';
import { CoinbaseFeedService } from './coinbase-feed/coinbase-feed.service';

@Controller()
export class AppController {

   /**
    * Currencies data structure
    */
   private _currencies: Currencies;

   /**
    * Portolio data structure
    */
   private _portfolio: Portfolio;

   /**
    * Coinbase class
    */
   private _coinbase: Coinbase;

   constructor(
      private configService: ConfigService,
      private readonly clientSocketGateway: ClientSocketGateway,
      private readonly coinbaseFeedService: CoinbaseFeedService
   ) {

      this._currencies = new Currencies();
      this._portfolio = new Portfolio( this.configService.get<string>('BASE_CURRENCY'), this._currencies );

      this._coinbase = new Coinbase(
         this.configService,
         this._currencies, 
         this._portfolio,
         this.clientSocketGateway,
         this.coinbaseFeedService
      );
   }

   @Get()
   @Render('index')
   root() {}
}
