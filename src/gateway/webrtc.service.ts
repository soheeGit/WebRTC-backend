import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WebrtcService {
  private rooms: Record<
    string,
    Map<string, { userId: string; userName: string }>
  > = {};

  handleJoinRoom(
    client: Socket,
    roomId: string,
    userId: string,
    userName: string,
  ): void {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = new Map();
    }
    for (const [socketId, user] of this.rooms[roomId].entries()) {
      if (user.userId === userId) {
        this.rooms[roomId].delete(socketId);
        break;
      }
    }

    this.rooms[roomId].set(client.id, { userId, userName });
    client.join(roomId);
  }

  handleLeaveRoom(client: Socket, room: string): void {
    if (this.rooms[room]) {
      this.rooms[room].delete(client.id);
      if (this.rooms[room].size === 0) {
        delete this.rooms[room];
      }
    }
    client.leave(room);
  }

  getClientsInRoom(
    roomId: string,
  ): { socketId: string; userId: string; userName: string }[] {
    return this.rooms[roomId]
      ? Array.from(this.rooms[roomId], ([socketId, { userId, userName }]) => ({
          socketId,
          userId,
          userName,
        }))
      : [];
  }

  getRoomIdWhereClientIn(clientId: string): string | undefined {
    for (const roomId in this.rooms) {
      if (this.rooms[roomId].has(clientId)) {
        return roomId;
      }
    }

    return undefined;
  }
}
