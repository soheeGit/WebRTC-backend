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

@WebSocketGateway({ cors: { origin: '*' } })
export class WebrtcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly webrtcService: WebrtcService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connected', client.id);
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
    const { roomId, userId, userName } = data;
    this.webrtcService.handleJoinRoom(client, roomId, userId, userName);

    // 현재 룸에 있는 다른 사용자들의 목록을 새로 접속한 사용자에게 전송, roomId도 함께 전송
    const usersInRoom = this.webrtcService.getClientsInRoom(roomId);
    client.emit('usersInRoom', { roomId, users: usersInRoom });

    // 새로운 사용자가 접속했음을 룸의 다른 사용자들에게 알림
    client.to(roomId).emit('userJoined', {
      socketId: client.id,
      userId: userId,
      userName: userName,
    });
    console.log(`Client ${client.id}(${userName}) joined room ${roomId}`);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: RTCSessionDescriptionDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Offer received from ${client.id} for ${data.receiverId}`);
    data['senderId'] = client.id;
    // 룸의 다른 클라이언트들에게만 offer를 전송
    client.to(data.receiverId).emit('offer', data);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: RTCSessionDescriptionDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Answer received from ${client.id} for${data.receiverId}`);
    data['clientId'] = client.id;
    // 룸의 다른 클라이언트들에게만 offer를 전송
    client.to(data.receiverId).emit('answer', data);
  }

  @SubscribeMessage('onicecandidate')
  handleIceCandidate(
    @MessageBody() data: CandidateDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`IceCandidates received from ${client.id}`, data);
    data['clientId'] = client.id;
    client.to(data.receiverId).emit('iceCandidate', data);
  }

  @SubscribeMessage('message')
  handlesendChatMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.webrtcService.getRoomIdWhereClientIn(client.id);
    console.log(
      `message from: ${client.id}(${data.name}) to ${data.roomId} say ${data.message} `,
    );
    console.log(data);
    this.server
      .to(roomId)
      .emit('message', { sender: data.name, message: data.message });
  }
}
