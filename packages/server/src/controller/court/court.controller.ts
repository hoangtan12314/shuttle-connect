import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { CreateCourtDto } from '../dtos/court';
import {
  GetCourtByIdUseCase,
  CreateCourtUseCase,
  ListCourtsByDistrictUseCase,
} from '../../application/court';
import { ValidateBodyPipe } from '../pipes';
import { Public } from '../guard';
import { ListCourtsByDistrictDto } from '../dtos/court/list-courts-by-district.dto';

@Controller('courts')
export class CourtController {
  constructor(
    @Inject(ListCourtsByDistrictUseCase)
    private readonly listCourtsByDistrictUseCase: ListCourtsByDistrictUseCase,
    @Inject(GetCourtByIdUseCase)
    private readonly getCourtByIdUseCase: GetCourtByIdUseCase,
    @Inject(CreateCourtUseCase)
    private readonly createCourtUseCase: CreateCourtUseCase,
  ) {}

  @Public()
  @Get()
  async listCourtsByDistrict(
    @Query(new ValidateBodyPipe(ListCourtsByDistrictDto))
    listCourtsByDistrictDto: ListCourtsByDistrictDto,
  ) {
    const courts = await this.listCourtsByDistrictUseCase.execute(listCourtsByDistrictDto);
    return courts;
  }

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
