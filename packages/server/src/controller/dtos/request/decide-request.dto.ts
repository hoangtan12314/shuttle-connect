import { DecideRequestInput, RequestStatus } from '@shuttle-connect/types';
import { IsIn } from 'class-validator';

export class DecideRequestDto implements DecideRequestInput {
  @IsIn([RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED])
  status!: RequestStatus;
}
