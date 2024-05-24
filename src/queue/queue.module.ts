import { Module, forwardRef } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { ShortnerModule } from 'src/shortner/shortner.module';

@Module({
  imports: [forwardRef(() => ShortnerModule)],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
