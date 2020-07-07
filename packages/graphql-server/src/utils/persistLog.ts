import { Stream, Readable } from 'stream';

const makeStream = (str: string): Readable => {
  const stream = new Readable();
  stream.push(str);
  stream.push(null);
  return stream;
};

interface PersistLogOptions {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

export default class PersistLog {
  private endpoint: string;
  private bucket: string;
  private accessKey: string;
  private secretKey: string;

  constructor(options: PersistLogOptions) {
    this.endpoint = options.endpoint;
    this.bucket = options.bucket;
    this.accessKey = options.accessKey;
    this.secretKey = options.secretKey;
  }

  public getStream(
    prefix: string,
    options?: {tailLines?: number}
  ): Stream {
    const {tailLines} = options || {};

    return makeStream(
`endpoint: ${this.endpoint}
bucket: ${this.bucket}
accessKey: ${this.accessKey}
secretKey: ${this.secretKey}
prefix: ${prefix}
tailLines: ${tailLines}
`);
  }
}
