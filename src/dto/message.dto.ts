import { IsString } from 'class-validator';

export class MessageDto {
  @IsString()
  roomId: string;
  message: string;
  name: string;
  userId: string;
}
