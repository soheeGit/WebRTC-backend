import { IsString } from 'class-validator';

export class RTCSessionDescriptionDto {
  @IsString()
  senderWebId: string;
  senderName: string;
  receiverId: string;
  roomId: string;

  @IsString()
  type: string;

  description: RTCSessionDescriptionInit;
}
