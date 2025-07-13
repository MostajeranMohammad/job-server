import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobManagerService } from './services/job-manager.service';
import { JobQueryDto } from './dto/job-query.dto';
import { JobOffersResponseDto } from './dto/job-response.dto';

@ApiTags('Job Offers')
@Controller('api/job-offers')
export class JobsController {
  constructor(private readonly jobManagerService: JobManagerService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve job offers with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved job offers',
    type: JobOffersResponseDto,
  })
  async getJobOffers(
    @Query(new ValidationPipe({ transform: true })) queryDto: JobQueryDto,
  ): Promise<JobOffersResponseDto> {
    return this.jobManagerService.findJobs(queryDto);
  }
}
