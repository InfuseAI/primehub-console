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
  secrekKey: string;
}

export default class PersistLog {
  constructor(options: PersistLogOptions) {
    //
  }

  public getStream(
    prefix: string,
    options?: {tailLines?: number}
  ): Stream {
    return makeStream('hello ' + prefix);
  }
}
