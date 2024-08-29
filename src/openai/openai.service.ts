import { Injectable } from '@nestjs/common';
import OpenAI from 'openai'
import * as fs from 'fs';

@Injectable()
export class OpenaiService {
    private openai: OpenAI

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })
    }

    async transcribeAudio(audioFile: string) {
        return await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFile),
            model: 'whisper-1',
        })
    }
}
