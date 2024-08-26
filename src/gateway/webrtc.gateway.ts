import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebrtcService } from './webrtc.service';
import { joinRoomDto } from 'src/dto/joinRoom.dto';
import { MessageDto } from 'src/dto/message.dto';
import { RTCSessionDescriptionDto } from 'src/dto/RTCSession.dto';
import { CandidateDto } from 'src/dto/candidate.dto';

@WebSocketGateway({ cors: { origin: 'http://127.0.0.1:5500' } })
export class WebrtcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly webrtcService: WebrtcService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const room of Object.keys(client.rooms)) {
      if (room !== client.id) {
        this.webrtcService.handleLeaveRoom(client, room);
        this.server.to(room).emit('userLeft', { user: client.id });
        console.log(`Client ${client.id} left room ${room}`);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: joinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.webrtcService.handleJoinRoom(client, data.room);

    // 현재 룸에 있는 다른 사용자들의 목록을 새로 접속한 사용자에게 전송
    const usersInRoom = this.webrtcService.getClientsInRoom(data.room);
    client.emit('usersInRoom', usersInRoom);

    // 새로운 사용자가 접속했음을 룸의 다른 사용자들에게 알림
    client.to(data.room).emit('userJoined', { user: client.id });
    console.log(`Client ${client.id} joined room ${data.room}`);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: RTCSessionDescriptionDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Offer received from ${client.id} for room ${data.room}`);
    data['clientId'] = client.id;
    // 룸의 다른 클라이언트들에게만 offer를 전송
    client.to(data.room).emit('offer', data);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: RTCSessionDescriptionDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Answer received from ${client.id} for room ${data.room}`);
    data['clientId'] = client.id;
    // 룸의 다른 클라이언트들에게만 offer를 전송
    this.server.to(data.room).emit('answer', data);
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @MessageBody() data: CandidateDto,
    @ConnectedSocket() client: Socket,
  ) {
    data['clientId'] = client.id;
    this.server.to(data.room).emit('iceCandidate', data);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.webrtcService.getRoomIdWhereClientIn(client.id);
    console.log(`message from: ${client.id} to ${roomId} say ${data.message}`);
    this.server
      .to(roomId)
      .emit('message', { sender: client.id, message: data.message });
  }
}
