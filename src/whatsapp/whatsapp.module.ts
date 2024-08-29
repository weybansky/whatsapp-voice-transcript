import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Module({
    imports: [
        // HttpModule,
        HttpModule.register({
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + process.env.WHATSAPP_GRAPH_API_TOKEN,
            },
            timeout: 60 * 1000
        }),
    ],
    providers: [WhatsappService]
})
export class WhatsappModule { }
