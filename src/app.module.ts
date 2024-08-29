import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenaiService } from './openai/openai.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { ConfigModule } from '@nestjs/config';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { OpenaiModule } from './openai/openai.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot(), WhatsappModule, OpenaiModule,
    // HttpModule,
    HttpModule.register({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.WHATSAPP_GRAPH_API_TOKEN,
      },
      timeout: 60 * 1000
    }),
  ],
  controllers: [AppController, WhatsappController],
  providers: [AppService, OpenaiService, WhatsappService],
})
export class AppModule { }
