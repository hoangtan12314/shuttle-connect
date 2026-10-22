import { Body, Controller, Get, Inject, Patch } from '@nestjs/common';
import { type AuthUser, CurrentUser } from '../guard';
import {
  CompleteOnboardingUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
} from '../../application/user';
import { ValidateBodyPipe } from '../pipes';
import { CompleteOnboardingDto, UpdateProfileDto } from '../dtos/user';

@Controller('users')
export class UserController {
  constructor(
    @Inject(GetProfileUseCase)
    private readonly getProfileUseCase: GetProfileUseCase,
    @Inject(UpdateProfileUseCase)
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    @Inject(CompleteOnboardingUseCase)
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
  ) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    const sessions = await this.getProfileUseCase.execute(user.id);
    return sessions;
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ValidateBodyPipe(UpdateProfileDto)) updateProfileDto: UpdateProfileDto,
  ) {
    const sessions = await this.updateProfileUseCase.execute(user.id, updateProfileDto);
    return sessions;
  }

  @Patch('me/onboarding')
  async completeOnboarding(
    @CurrentUser() user: AuthUser,
    @Body(new ValidateBodyPipe(CompleteOnboardingDto)) dto: CompleteOnboardingDto,
  ) {
    return this.completeOnboardingUseCase.execute(user.id, dto);
  }
}
