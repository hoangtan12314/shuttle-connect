import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreateRequestDto } from '../dtos';
import { CreateRequestUseCase } from '../../application/request';
import { ValidateBodyPipe } from '../pipes';
import { type AuthUser, CurrentUser } from '../guard';

@Controller('requests')
export class RequestController {
  constructor(
    @Inject(CreateRequestUseCase)
    private readonly createRequestUseCase: CreateRequestUseCase,
  ) {}

  @Post()
  async createRequest(
    @CurrentUser() user: AuthUser,
    @Body(new ValidateBodyPipe(CreateRequestDto)) createRequestDto: CreateRequestDto,
  ) {
    const createdRequest = await this.createRequestUseCase.execute(user.id, {
      sessionId: createRequestDto.sessionId,
    });
    return createdRequest;
  }
}
