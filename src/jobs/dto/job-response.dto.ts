import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'TechCorp' })
  name: string;

  @ApiProperty({ example: 'Technology', required: false })
  industry?: string;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  website?: string;
}

export class LocationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Seattle', required: false })
  city?: string;

  @ApiProperty({ example: 'WA', required: false })
  state?: string;
}

export class JobResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'P1-672' })
  sourceId: string;

  @ApiProperty({ example: 'Frontend Developer' })
  title: string;

  @ApiProperty({ example: 'Full-Time', required: false })
  type?: string;

  @ApiProperty({ example: 62000, required: false })
  salaryMin?: number;

  @ApiProperty({ example: 136000, required: false })
  salaryMax?: number;

  @ApiProperty({ example: 'USD', required: false })
  currency?: string;

  @ApiProperty({ example: 3, required: false })
  experience?: number;

  @ApiProperty({ example: false })
  remote: boolean;

  @ApiProperty({ example: ['Java', 'Spring Boot', 'AWS'], required: false })
  skills?: string[];

  @ApiProperty({ example: '2025-07-06T01:25:07.877Z', required: false })
  postedDate?: Date;

  @ApiProperty({ type: CompanyResponseDto })
  company: CompanyResponseDto;

  @ApiProperty({ type: LocationResponseDto })
  location: LocationResponseDto;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 10 })
  itemsPerPage: number;

  @ApiProperty({ example: 50 })
  totalItems: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class JobOffersResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  data: JobResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
