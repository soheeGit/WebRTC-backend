import { IsString } from 'class-validator';

export class RTCSessionDescriptionDto {
  @IsString()
  room: string;

  @IsString()
  type: string;

  description: RTCSessionDescriptionInit;
}
