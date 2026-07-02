import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SolarisApiService } from './solaris-api/solaris-api.service';

@Module({
  imports: [HttpModule],
  providers: [SolarisApiService],
  exports: [SolarisApiService],
})
export class SolarisClientModule {}
