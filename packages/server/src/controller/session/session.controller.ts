import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { CreateSessionsUseCase, ListAllSessionsUseCase } from '../../application/session';
import { CreateSessionDto } from '../dtos';

@Controller('sessions')
export class SessionController {
  constructor(
    @Inject(ListAllSessionsUseCase)
    private readonly listAllSessionsUseCase: ListAllSessionsUseCase,
    @Inject(CreateSessionsUseCase)
    private readonly createSessionUseCase: CreateSessionsUseCase,
  ) {}

  @Get()
  async listSessions() {
    return await this.listAllSessionsUseCase.execute();
  }

  @Post()
  async createSession(@Body() createSessionDTO: CreateSessionDto) {
    // TODO: Implement Cognito Auth guard after finish testing the API flow
    await this.createSessionUseCase.execute("1234", createSessionDTO);
  }
}
