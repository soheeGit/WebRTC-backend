import { Module } from '@nestjs/common';
import { WebrtcModule } from './gateway/webrtc.module';

@Module({
  imports: [WebrtcModule],
})
export class AppModule {}
