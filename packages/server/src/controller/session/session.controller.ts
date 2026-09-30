import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  ListAllSessionsUseCase,
} from '../../application/session';
import { CreateSessionDto } from '../dtos';
import { ValidateBodyPipe } from '../pipes';
import { type AuthUser, CurrentUser, Public } from '../guard';

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

  @Public()
  @Get()
  async listSessions() {
    const sessions = await this.listAllSessionsUseCase.execute();
    return sessions;
  }

  @Public()
  @Get(':id')
  async getSessionById(@Param('id') id: string) {
    const session = await this.getSessionByIdUseCase.execute(id);
    return session;
  }

  @Post()
  async createSession(
    @CurrentUser() user: AuthUser,
    @Body(new ValidateBodyPipe(CreateSessionDto)) createSessionDTO: CreateSessionDto,
  ) {
    // TODO: Implement Cognito Auth guard after finish testing the API flow
    const createdSessions = await this.createSessionUseCase.execute(user.id, createSessionDTO);
    return createdSessions;
  }
}
