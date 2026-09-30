import { CreateRequestInput } from '@shuttle-connect/types';
import { IsString } from 'class-validator';

export class CreateRequestDto implements CreateRequestInput {
  @IsString()
  sessionId!: string;
}
