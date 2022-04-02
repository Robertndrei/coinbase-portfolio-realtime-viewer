import { Injectable } from '@nestjs/common';
import {
   InjectWebSocketProvider,
   WebSocketClient,
   OnOpen,
   OnClose,
   OnMessage,
} from 'nestjs-websocket';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CoinbaseFeedService {


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
      @InjectWebSocketProvider()
      private readonly ws: WebSocketClient
   ) {}

   /**
    * @ignore
    */
   @OnOpen()
   onOpen() {
      this._connected.next(true);
   }

   /**
    * @ignore
    */
   @OnClose()
   onClose() {
      this._connected.next(false);
   }

   /**
    * @ignore
    */
   @OnMessage()
   message(data: WebSocketClient.Data) {
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
