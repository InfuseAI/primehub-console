
export interface SmtpConfig {
  host: string;
  port: number;
  fromDisplayName: string;
  from: string;
  replyToDisplayName: string;
  replyTo: string;
  envelopeFrom: string;
  enableSSL: boolean;
  enableStartTLS: boolean;
  enableAuth: boolean;
  username: string;
  password: string;
}

export class EmailClient {
  private smtpConfig: SmtpConfig;

  constructor({smtpConfig}: {smtpConfig: SmtpConfig}) {
    this.smtpConfig = smtpConfig;
  }
}
