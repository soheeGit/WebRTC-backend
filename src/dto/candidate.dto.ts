import { IsString } from 'class-validator';

export class CandidateDto {
  @IsString()
  room: string;

  candidate: object;
}
