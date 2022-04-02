import {
   MessageBody,
   SubscribeMessage,
   WebSocketGateway,
   WebSocketServer,
   WsResponse,
} from '@nestjs/websockets';
import { from, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'socket.io';

import { Portfolio } from '../models/portfolio';

@WebSocketGateway({
   cors: {
      origin: '*',
   },
})
export class ClientSocketGateway {
   @WebSocketServer() server: Server;

   private _clientRequest = new Subject<string>();
   clientRequest = this._clientRequest.asObservable();

   /**
    * Receive request from client
    */
   @SubscribeMessage('request')
   async onRequest(@MessageBody() data: string) {
      this._clientRequest.next(data);
   }

   /**
    * Update client data
    */
   updateClient(portfolio: Portfolio) {
      this.server.emit('update', portfolio);
   }
}