import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CreateCourtDto } from '../dtos/court';
import { GetCourtByIdUseCase, CreateCourtUseCase } from '../../application/court';
import { ValidateBodyPipe } from '../pipes';

@Controller('courts')
export class CourtController {
  constructor(
    @Inject(GetCourtByIdUseCase)
    private readonly getCourtByIdUseCase: GetCourtByIdUseCase,
    @Inject(CreateCourtUseCase)
    private readonly createCourtUseCase: CreateCourtUseCase,
  ) {}

  @Get(':id')
  async getCourtById(@Param('id') id: string) {
    return this.getCourtByIdUseCase.execute(id);
  }

  @Post()
  async createCourt(@Body(new ValidateBodyPipe(CreateCourtDto)) createCourtDto: CreateCourtDto) {
    console.log('CourtController.createCourt: createCourtDto', createCourtDto);
    return this.createCourtUseCase.execute({
      name: createCourtDto.name,
      address: createCourtDto.address,
      district: createCourtDto.district,
      city: createCourtDto.city,
      latitude: createCourtDto.latitude,
      longitude: createCourtDto.longitude,
    });
  }
}
