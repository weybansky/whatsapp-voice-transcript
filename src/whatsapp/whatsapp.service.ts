import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
    /**
     * Facebook Graph API version
     * part of the API URL
    */
    protected apiVersion = 'v20.0';

    /**
     * Whatsapp business phone number id
    */
    protected businessPhoneNumberId: string;

    /**
     * Body from a Whatsapp webhook request
    */
    protected waBody: object;

    /**
     * User Phone number
    */
    protected userPhone: string;

    /**
     * Whatsapp Message Id
    */
    protected waMessageId: string;


    constructor(
        private readonly httpService: HttpService
    ) {
        this.businessPhoneNumberId = process.env.WHATSAPP_PHONE_ID
    }

    public setWaBody(body: object) {
        this.waBody = body;
    }

    public setUserPhone(userPhone: string) {
        this.userPhone = userPhone;
    }

    public setWaMessageId(id: string | null) {
        if (!!id) {
            this.waMessageId = id;
        }
    }

    async markMessageAsRead() {
        if (!this.waMessageId) {
            return
        }

        return await firstValueFrom(
            this.httpService.post(`https://graph.facebook.com/${this.apiVersion}/${this.businessPhoneNumberId}`, {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: this.waMessageId,
            })
        )
    }

    async sendTextMessage(message: string) {
        let parameters = {
            messaging_product: "whatsapp",
            to: this.userPhone,
            text: { body: message },
            preview_url: true,
            context: null
        };


        if (!!this.waMessageId) {
            parameters.context = {
                message_id: this.waMessageId, // shows the message as a reply to the original user message
            };
        }

        const { data } = await firstValueFrom(
            this.httpService.post(`https://graph.facebook.com/${this.apiVersion}/${this.businessPhoneNumberId}/messages`, parameters)
        )

        return data;
    }

    async getAudioUrl(audioId: string) {
        // Response
        // {
        //     "url": "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=3708801446114094&ext=1716911980&hash=ATuYPCl5h32HYJHpeW4wjwmzpYBgwirA6NK1tTZkl-Ks-w",
        //     "mime_type": "audio/ogg",
        //     "sha256": "1ed656feb7d2f377c507f4ebd4c60e89eccfab84120f75afc99bb9b66f184367",
        //     "file_size": 11797,
        //     "id": "3708801446114094",
        //     "messaging_product": "whatsapp"
        // }

        const { data } = await firstValueFrom(
            this.httpService.get(`https://graph.facebook.com/${this.apiVersion}/${audioId}`)
        )

        // {
        //     url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1553736908895719&ext=1724972633&hash=ATvCbCh4Q4hqdj5aXKU0-hkSvDoqqibfMkUi9-BQvMei6Q',
        //     mime_type: 'audio/ogg',
        //     sha256: '793e8349b0931d6575c8133d1eababdaf23a9985fcbd68650b7b3ec1c0d12468',
        //     file_size: 6636,
        //     id: '1553736908895719',
        //     messaging_product: 'whatsapp'
        //  }

        return data;
    }

    async downloadAudioFromUrl(audioId: string, audioUrl: string) {
        try {
            const response = await firstValueFrom(this.httpService.get(audioUrl, { responseType: 'stream' }))

            let filePath = path.join(__dirname, '../../uploads/whatsapp/audio')

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true })
            }

            filePath = path.join(filePath, `${audioId}.ogg`)

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer)

            return new Promise<string>((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
            
        } catch (error) {
            console.error('Error downloading or saving the audio file:', error);
            throw new HttpException('Failed to download or save the audio file', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
