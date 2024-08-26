import { Module } from '@nestjs/common';
import { WebrtcGateway } from './webrtc.gateway';
import { WebrtcService } from './webrtc.service';

@Module({
  providers: [WebrtcGateway, WebrtcService],
})
export class WebrtcModule {}
