import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  ListAllSessionsUseCase,
} from '../../application/session';
import { CreateSessionDto } from '../dtos';

@Controller('sessions')
export class SessionController {
  constructor(
    @Inject(ListAllSessionsUseCase)
    private readonly listAllSessionsUseCase: ListAllSessionsUseCase,
    @Inject(CreateSessionsUseCase)
    private readonly createSessionUseCase: CreateSessionsUseCase,
    @Inject(GetSessionByIdUseCase)
    private readonly getSessionByIdUseCase: GetSessionByIdUseCase,
  ) {}

  @Get()
  async listSessions() {
    return await this.listAllSessionsUseCase.execute();
  }

  @Get(':id')
  async getSessionById(@Param('id') id: string) {
    return this.getSessionByIdUseCase.execute(id);
  }

  @Post()
  async createSession(@Body() createSessionDTO: CreateSessionDto) {
    // TODO: Implement Cognito Auth guard after finish testing the API flow
    await this.createSessionUseCase.execute('1234', createSessionDTO);
  }
}
