import { Module } from '@nestjs/common';
import { ShortnerController } from './shortner.controller';
import { ShortnerService } from './shortner.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortUrlSchema } from './shortner.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ShortUrlModel', schema: ShortUrlSchema },
    ]),
  ],
  controllers: [ShortnerController],
  providers: [ShortnerService],
})
export class ShortnerModule {}
