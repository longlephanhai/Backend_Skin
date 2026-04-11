import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose/dist';
import { Connection } from 'mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => Logger.log('connected'));
          connection.on('open', () => Logger.log('open'));
          connection.on('disconnected', () => Logger.log('disconnected'));
          connection.on('reconnected', () => Logger.log('reconnected'));
          connection.on('disconnecting', () => Logger.log('disconnecting'));
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
