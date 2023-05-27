import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import * as WebSocket from "ws";
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { createHmac } from 'crypto';

@Injectable()
export class CoinbaseFeedService {

   /**
    * Websocket
    */
   private ws: WebSocket;

   /**
    * Keep alive watchdog
    */
   private wsKeppAlive;

   /**
    * Activity monitor
    */
   private activityMonitor;

   /**
    * Store subscribed tickets to resusbscribe when connection lost and
    * reconnect
    */
   private tickers: string[] = [];

   /**
    * An observable that stores the connection state with the
    * websocket server
    */
   private _connected = new BehaviorSubject<boolean>(false);
   connected = this._connected.asObservable();

   /**
    * An observable that triggers on every price change
    */
   private _ticker = new BehaviorSubject<any>(undefined);
   ticker = this._ticker.asObservable();

   /**
    * Logger
    */
   private readonly logger = new Logger("CoinbaseFeedService");

   constructor(
      private configService: ConfigService,
      private readonly httpService: HttpService
   ) {
      this.connect();
      this.initWatchdog();
   }

   connect() {
      this.ws = new WebSocket(this.configService.get<string>('COINBASE_WSS_FEED_URL'));

      this.ws.on("open", () => {
         this._connected.next(true);
         this.wsKeppAlive = undefined;
         this.tickers.length ? this.subscribe(this.tickers) : null;

         this.logger.log("Coinbase websocket oppened");
      });

      this.ws.on("error", (message) => {
         this.ws.close()
         this._connected.next(false);
         this.wsKeppAlive = undefined;

         this.logger.error("Coinbase websocket error");
      });

      this.ws.on("close", (message) => {
         this._connected.next(false);
         this.wsKeppAlive = undefined;

         this.logger.warn("Coinbase websocket closed");
      });

      this.ws.on("message", (message) => {
         this.message(message);
         this.resetActivityMonitor();
      });

      this.ws.on("pong", (message) => {
         clearTimeout(this.wsKeppAlive);
         this.wsKeppAlive = undefined;
      })
   }

   initWatchdog(){ 
      setInterval(() => {
         if ( this._connected.getValue() ) {
            try{
               this.ws.ping(1);
            } catch(e) {}
         } 

         if ( this.wsKeppAlive === undefined ) {
            this.wsKeppAlive = setTimeout(() => {
               if ( !this._connected.getValue() ) {
                  this.logger.warn("Pong not received, reconnecting...");
                  this.connect();
               }
            }, 5000);
         }
      }, 5000)
   }

   resetActivityMonitor() {
      clearTimeout(this.activityMonitor);
      this.activityMonitor = setTimeout(() => {
         // Close de socket, the watchdog will launch it again
         this.ws.close();

         this.logger.warn("No activity detected during 5 min. Closing socket...");
      }, 300000);
   }

   /**
    * @ignore
    */
   message(data: any) {
      let message;

      try {
         message = JSON.parse(data.toString());

         switch( message.type ) {
            case 'ticker': 
               this._ticker.next(message);
            break;
            case 'subscriptions':

               if ( message.channels.length ) {
                  // console.log('Coinbase subscribed', message.channels);
               } else {
                  // console.log('Coinbase feed unsubscribed');
               }
            break;
         }
      } catch ( e ) {}
   }

   /**
    * Subscribe to tickers. "BTC-EUR" and "BTC-USD" will be
    * automatically added
    * 
    * @example
    * subscribe(["BNT-USD", "UNI-USD"])
    * 
    * @param {string[]} tickers The tickers to subscribe
    */
   subscribe(tickers: string[]) {
      this.tickers = tickers;

      let product_ids = [...new Set([...tickers, "BTC-EUR", "BTC-USD"])];

      return this.ws.send(JSON.stringify(
         {
            "type": "subscribe",
            "product_ids": product_ids,
            "channels": 
               [
                  {
                     "name": "ticker",
                     "product_ids": product_ids
                  }
               ]
         }
      ));
   }

   /**
    * Unsubscribe tickers
    */
   unsubscribe() {
      return this.ws.send(JSON.stringify(
         {
            "type": "unsubscribe",
            "channels": ["ticker"]
         }
      ));
   }

   async getAccounts(userAccounts: any[] = [], nextUrl: string | undefined = undefined): Promise<any[]> {
      //get unix time in seconds
      var timestamp = Math.floor(Date.now() / 1000);

      // set the parameter for the request message
      var req = {
         method: 'GET',
         path: !!nextUrl ? nextUrl : '/v2/accounts',
         body: ''
      };

      var message = timestamp + req.method + req.path + req.body;

      var signature = createHmac("sha256", this.configService.get<string>('COINBASE_API_SECRET'))
         .update(message)
         .digest("hex");

      var headers = {
         'CB-ACCESS-SIGN': signature,
         'CB-ACCESS-TIMESTAMP': timestamp,
         'CB-ACCESS-KEY': this.configService.get<string>('COINBASE_API_KEY'),
         'CB-VERSION': '2015-07-22'
      }

      const response = await this.httpService.axiosRef.get(`https://api.coinbase.com${req.path}`, {headers});
      let accounts = response.data.data;

      userAccounts = [...userAccounts, ...accounts];

      if ( response.data.pagination.next_uri !== null ) {
         return await this.getAccounts(userAccounts, response.data.pagination.next_uri);
      } else {
         return userAccounts;
      }
   }
}
