import { Module } from '@nestjs/common';
import { ClientSocketGateway } from './client-socket.gateway';

@Module({
   providers: [ClientSocketGateway],
   exports: [ClientSocketGateway],
})
export class ClientSocketModule {}