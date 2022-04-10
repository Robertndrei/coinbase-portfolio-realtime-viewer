import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';
import * as WebSocket from "ws";
import { ConfigService } from '@nestjs/config';

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

   constructor(
      private configService: ConfigService
   ) {
      this.connect();
      this.init();
   }

   connect() {
      this.ws = new WebSocket(this.configService.get<string>('COINBASE_PRO_WSS_FEED_URL'));
   }

   init(){ 
      this.ws.on("open", () => {
         this._connected.next(true);
         // this.ws.send(Math.random());

         this.tickers.length ? this.subscribe(this.tickers) : null;
      });

      this.ws.on("error", (message) => {
         this.ws.close()
         this._connected.next(false);     
      });

      this.ws.on("close", (message) => {
         setTimeout(() => {
            this._connected.next(false);
            this.connect();
         }, 1000);
      });

      this.ws.on("message", (message) => {
         //handler
         this.message(message);
      });

      this.ws.on("pong", (message) => {
         clearTimeout(this.wsKeppAlive);
         this.wsKeppAlive = undefined;
      })

      setInterval(() => {
         if ( this._connected.getValue() ) {
            this.ws.ping(1);

            if ( this.wsKeppAlive === undefined ) {
               this.wsKeppAlive = setTimeout(() => {
                  this.connect();
               }, 30000);
            }
         }
      }, 10000)
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

}
