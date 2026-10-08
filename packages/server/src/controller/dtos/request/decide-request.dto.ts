import { DecideRequestInput, RequestStatus } from '@shuttle-connect/types';
import { IsEnum, IsString } from 'class-validator';

export class DecideRequestDto implements DecideRequestInput {
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}
