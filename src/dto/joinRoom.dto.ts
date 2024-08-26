import { IsString } from 'class-validator';

export class joinRoomDto {
  @IsString()
  room: string;
}
