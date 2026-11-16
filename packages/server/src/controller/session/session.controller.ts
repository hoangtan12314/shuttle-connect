import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_COVER_BYTES, RequestStatus } from '@shuttle-connect/types';
import {
  CreateSessionsUseCase,
  GetSessionByIdUseCase,
  GetSessionsByUserIdUseCase,
  ListSessionsByDistrictUseCase,
  UpdateSessionUseCase,
  UploadCoverUseCase,
} from '../../application/session';
import {
  CreateSessionDto,
  DecideRequestDto,
  ListSessionsByDistrictDto,
  UpdateSessionDto,
} from '../dtos';
import { ValidateBodyPipe } from '../pipes';
import { type AuthUser, CurrentUser, Public } from '../guard';
import {
  DecideRequestUseCase,
  GetRequestsUseCase,
  UndoDecisionUseCase,
  WithdrawRequestUseCase,
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
    @Inject(WithdrawRequestUseCase)
    private readonly withdrawRequestUseCase: WithdrawRequestUseCase,
    @Inject(UploadCoverUseCase)
    private readonly uploadCoverUseCase: UploadCoverUseCase,
    @Inject(UpdateSessionUseCase)
    private readonly updateSessionUseCase: UpdateSessionUseCase,
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

  // Host-only edit of the fields that live only on the session's own item. Court and time are not
  // accepted (UpdateSessionDto has no such fields) -- request items copy them.
  @Patch(':id')
  async updateSession(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ValidateBodyPipe(UpdateSessionDto)) updateSessionDTO: UpdateSessionDto,
  ) {
    return this.updateSessionUseCase.execute(user.id, id, updateSessionDTO);
  }

  // The file is sent straight to us (multipart/form-data, field "file") instead of to S3 via a
  // presigned ticket -- see CLAUDE.md's cover-photo section for why. memoryStorage() because the
  // file (capped at MAX_COVER_BYTES) only needs to live in memory long enough to hand to S3;
  // there's no reason to touch Lambda's /tmp. The interceptor's own fileSize limit is a cheap
  // guard in front of UploadCoverUseCase's own check -- if multer rejects it first, that
  // currently surfaces as a 500 via GlobalExceptionFilter's catch-all rather than a clean 400;
  // acceptable since resizeImageForUpload keeps real uploads far under the cap in practice.
  @Patch(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_COVER_BYTES } }),
  )
  async uploadCover(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadCoverUseCase.execute(user.id, id, {
      buffer: file.buffer,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  // A different path shape from decide (':userId' vs. 'mine'), not the same route with a status
  // value, on purpose: the authorization story is different (self-service vs. host-only), and no
  // body is needed -- withdrawing is the only action this route can ever mean.
  @Patch(':id/requests/mine/withdraw')
  async withdrawRequest(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const withdrawnRequest = await this.withdrawRequestUseCase.execute(user.id, id);
    return withdrawnRequest;
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
