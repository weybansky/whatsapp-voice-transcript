import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { OpenaiService } from 'src/openai/openai.service';

@Controller('whatsapp')
export class WhatsappController {

    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly openaiService: OpenaiService
    ) { }

    @Get('verify')
    verify(@Query('hub_mode') hub_mode: string, @Query('hub_verify_token') hub_verify_token: string, @Query('hub_challenge') hub_challenge: string) {
        console.log(
            hub_mode,
            hub_verify_token,
            hub_challenge
        )
    }

    @Post('incoming')
    async incoming(@Body('object') object_type: string, @Body('entry') entry: object) {
        const entryChange = entry[0]
        const waMessage = entryChange['changes'][0]['value']['messages'][0]

        // console.log(waMessage)

        const waMessageType = waMessage['type']
        const from = waMessage['from']
        const waMessageId = waMessage['id']

        this.whatsappService.setWaMessageId(waMessageId)
        this.whatsappService.setUserPhone(from)

        if (waMessageType !== 'audio') {
            throw new HttpException('Message not an Audio message', HttpStatus.BAD_REQUEST)
        }

        this.whatsappService.markMessageAsRead()

        // receive audio file
        const audioId = waMessage['audio']['id']
        const { url: audioUrl } = await this.whatsappService.getAudioUrl(audioId)
        // console.log(audioId, audioUrl)

        // get audio file 
        const audioFilePath = await this.whatsappService.downloadAudioFromUrl(audioId, audioUrl)
        console.log(audioFilePath)

        // transcribe
        const transcription = await this.openaiService.transcribeAudio(audioFilePath)

        this.whatsappService.sendTextMessage(transcription.text)

        return {
            message: transcription.text
        }
    }
}
