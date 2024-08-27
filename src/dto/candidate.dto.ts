import { IsString } from 'class-validator';

export class CandidateDto {
  @IsString()
  roomId: string;
  candidate: object;
  clientId: string;
  clientWebId: string;
  userName: string;
  receiverId: string;
  receiverWebId: string;
}
