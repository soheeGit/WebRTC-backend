import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WebrtcService {
  private rooms: Record<string, Set<string>> = {};

  handleJoinRoom(client: Socket, room: string): void {
    if (!this.rooms[room]) {
      this.rooms[room] = new Set();
    }
    this.rooms[room].add(client.id);
    client.join(room);
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

  getClientsInRoom(room: string): string[] {
    return this.rooms[room] ? Array.from(this.rooms[room]) : [];
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
