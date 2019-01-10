import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

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
  private transporter: Mail;

  constructor({smtpConfig}: {smtpConfig: SmtpConfig}) {
    this.smtpConfig = smtpConfig;
    const options: any = {
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.enableSSL,
      pool: true
    };

    if (this.smtpConfig.enableAuth) {
      options.auth = {
        user: this.smtpConfig.username,
        pass: this.smtpConfig.password
      };
    }

    this.transporter = nodemailer.createTransport(options);
  }

  public async sendMail(
    {to, subject, content}:
    {to: string, subject: string, content: string}) {
    return this.transporter.sendMail({
      from: {
        name: this.smtpConfig.fromDisplayName,
        address: this.smtpConfig.from,
      },
      to,
      subject,
      html: content,
      replyTo: this.smtpConfig.replyTo
    });
  }
}
