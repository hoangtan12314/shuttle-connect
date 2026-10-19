import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { RequestStatus } from '@shuttle-connect/types';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  GetSessionsByUserIdUseCase,
  ListSessionsByDistrictUseCase,
} from '../../application/session';
import { CreateSessionDto, DecideRequestDto, ListSessionsByDistrictDto } from '../dtos';
import { ValidateBodyPipe } from '../pipes';
import { type AuthUser, CurrentUser, Public } from '../guard';
import {
  DecideRequestUseCase,
  GetRequestsUseCase,
  UndoDecisionUseCase,
} from '../../application/request';

@Controller('sessions')
export class SessionController {
  constructor(
    @Inject(ListSessionsByDistrictUseCase)
    private readonly listSessionsByDistrictUseCase: ListSessionsByDistrictUseCase,
    @Inject(CreateSessionsUseCase)
    private readonly createSessionUseCase: CreateSessionsUseCase,
    @Inject(GetSessionByIdUseCase)
    private readonly getSessionByIdUseCase: GetSessionByIdUseCase,
    @Inject(GetSessionsByUserIdUseCase)
    private readonly getSessionsByUserIdUseCase: GetSessionsByUserIdUseCase,
    @Inject(GetRequestsUseCase)
    private readonly getRequestsUseCase: GetRequestsUseCase,
    @Inject(DecideRequestUseCase)
    private readonly decideRequestUseCase: DecideRequestUseCase,
    @Inject(UndoDecisionUseCase)
    private readonly undoDecisionUseCase: UndoDecisionUseCase,
  ) {}

  @Public()
  @Get()
  async listSessionsByDistrict(
    @Query(new ValidateBodyPipe(ListSessionsByDistrictDto))
    listSessionsByDistrictDto: ListSessionsByDistrictDto,
  ) {
    const sessions = await this.listSessionsByDistrictUseCase.execute(listSessionsByDistrictDto);
    return sessions;
  }

  @Get('mine')
  async getMineSession(@CurrentUser() user: AuthUser) {
    const sessions = await this.getSessionsByUserIdUseCase.execute(user.id);
    return sessions;
  }

  @Get(':id/requests')
  async getRequestsBySession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const requests = await this.getRequestsUseCase.execute(user.id, id);
    return requests;
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
    const createdSessions = await this.createSessionUseCase.execute(user.id, createSessionDTO);
    return createdSessions;
  }

  // Undo shares this route/DTO rather than getting its own -- it's still "the host sets this
  // request's status", just to PENDING instead of APPROVED/REJECTED. DecideRequestDto's
  // @IsEnum(RequestStatus) already accepts PENDING, so no DTO change was needed.
  @Patch(':id/requests/:userId')
  async decideRequest(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body(new ValidateBodyPipe(DecideRequestDto)) decideRequestDTO: DecideRequestDto,
  ) {
    if (decideRequestDTO.status === RequestStatus.PENDING) {
      return this.undoDecisionUseCase.execute(user.id, id, userId);
    }

    const decidedRequest = await this.decideRequestUseCase.execute(
      user.id,
      id,
      userId,
      decideRequestDTO,
    );
    return decidedRequest;
  }
}
