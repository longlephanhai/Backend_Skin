import { Body, Controller, Post } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { Public, ResponseMessage } from 'src/decorator/customize';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) { }

  @Post('explain-task')
  @Public()
  @ResponseMessage('Ai Assistant - Explain Task successfully')
  explainTask(@Body('task') task: string) {
    return this.aiAssistantService.explainTask(task);
  }
}
