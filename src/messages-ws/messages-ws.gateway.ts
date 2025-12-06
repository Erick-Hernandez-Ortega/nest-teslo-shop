import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() wss: Server;

  constructor(private readonly messagesWsService: MessagesWsService, private readonly jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    const token: string = client.handshake.headers.auth as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    } catch (error: unknown) {
      client.disconnect();
      return;
    }
    // console.log('Client connected', client.id)
    console.log(`Clientes connected: ${this.messagesWsService.getConnectClient()}`);
    this.wss.emit('clients-updates', this.messagesWsService.getIdsConnectClient());
  }
  handleDisconnect(client: Socket) {
    // console.log('Client dispnpconnected', client.id)
    this.messagesWsService.removeClient(client.id);
    console.log(`Clientes connected: ${this.messagesWsService.getConnectClient()}`);
    this.wss.emit('clients-updates', this.messagesWsService.getIdsConnectClient());
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    console.log(client.id, payload);
    // ! Emite unicamente al cliente
    // client.emit('message-from-server', {
    //   fullName: 'soy pedro',
    //   message: payload.message
    // });

    // ! Emite a todos menos al cliente
    client.broadcast.emit('message-from-server', {
        fullName: this.messagesWsService.getUserFullNameBySockerId(client.id),
        message: payload.message
    });

    // ! Emite a todos
    // this.wss.emit('message-from-server', {
    //   fullName: 'soy pedro',message-from-server
    //   message: payload.message
    // });
  }
}
