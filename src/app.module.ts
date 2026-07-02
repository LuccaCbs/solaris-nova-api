import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { AgentModule } from './agent/agent.module';
import { SolarisClientModule } from './solaris-client/solaris-client.module';
import { NovaI18nModule } from './i18n/nova-i18n.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChatModule,
    AgentModule,
    SolarisClientModule,
    NovaI18nModule,
  ],
  controllers: [],
})
export class AppModule {}
