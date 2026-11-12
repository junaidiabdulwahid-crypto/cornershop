import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  /** For load balancers and uptime checks: 200 only when the database answers. */
  @Get()
  async check(): Promise<{ status: 'ok'; database: 'up' }> {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException('Database is not reachable');
    }
  }
}
