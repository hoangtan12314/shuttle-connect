import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CreateCourtDto } from '../dtos/court';
import { GetCourtByIdUseCase, CreateCourtUseCase } from '../../application/court';
import { ValidateBodyPipe } from '../pipes';
import { Public } from '../guard';

@Controller('courts')
export class CourtController {
  constructor(
    @Inject(GetCourtByIdUseCase)
    private readonly getCourtByIdUseCase: GetCourtByIdUseCase,
    @Inject(CreateCourtUseCase)
    private readonly createCourtUseCase: CreateCourtUseCase,
  ) {}

  @Public()
  @Get(':id')
  async getCourtById(@Param('id') id: string) {
    const court = await this.getCourtByIdUseCase.execute(id);
    return court; 
  }

  @Post()
  async createCourt(@Body(new ValidateBodyPipe(CreateCourtDto)) createCourtDto: CreateCourtDto) {
    const createdCourt = await this.createCourtUseCase.execute({
      name: createCourtDto.name,
      address: createCourtDto.address,
      district: createCourtDto.district,
      city: createCourtDto.city,
      latitude: createCourtDto.latitude,
      longitude: createCourtDto.longitude,
    });
    return createdCourt;
  }
}
