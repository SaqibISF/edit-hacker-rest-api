import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { type Algorithm } from 'jsonwebtoken';

interface EnvironmentVariables {
  MONGO_URI: string;
  PORT: number;
  ACCESS_TOKEN_KEY: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRY: StringValue;
  ACCESS_TOKEN_ALGORITHM: Algorithm;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
  RESEND_EMAIL_FROM: string;
}

@Injectable()
export class EnvService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  get mongo_uri(): string {
    return this.configService.get('MONGO_URI', { infer: true })!;
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true })!;
  }

  get access_token_key(): string {
    return this.configService.get('ACCESS_TOKEN_KEY', { infer: true })!;
  }

  get access_token_secret(): string {
    return this.configService.get('ACCESS_TOKEN_SECRET', { infer: true })!;
  }

  get access_token_expiry(): StringValue {
    return this.configService.get('ACCESS_TOKEN_EXPIRY', { infer: true })!;
  }

  get access_token_algorithm(): Algorithm {
    return this.configService.get('ACCESS_TOKEN_ALGORITHM', { infer: true })!;
  }

  get frontend_url(): string {
    return this.configService.get('FRONTEND_URL', { infer: true })!;
  }

  get reset_password_url(): string {
    return `${this.frontend_url}/reset-password`;
  }

  get verify_account_url(): string {
    return `${this.frontend_url}/verify-account`;
  }

  get recover_account_url(): string {
    return `${this.frontend_url}/recover-account`;
  }

  get resend_api_key(): string {
    return this.configService.get('RESEND_API_KEY', { infer: true })!;
  }

  get resend_email_from(): string {
    return this.configService.get('RESEND_EMAIL_FROM', { infer: true })!;
  }
}
