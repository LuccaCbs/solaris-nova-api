import {
  CanActivate,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DebugEndpointGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const flag = this.configService.get<string>('ENABLE_DEBUG_ANALYZE');

    if (nodeEnv === 'production') {
      if (flag === 'true') {
        return true;
      }
      throw new NotFoundException();
    }

    if (flag === 'false') {
      throw new NotFoundException();
    }

    return true;
  }
}
