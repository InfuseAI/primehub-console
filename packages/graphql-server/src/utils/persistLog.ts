import { Stream, Readable } from 'stream';
import {Client, BucketItem} from 'minio';
import CombinedStream from 'combined-stream';
import { createGunzip } from 'zlib';
import split from 'split';
import TailStream from './stream';
// import getStream from 'get-stream';

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
  private minioClient: Client;
  private bucket: string;

  constructor(options: PersistLogOptions) {
    this.bucket = options.bucket;
    const url = new URL(options.endpoint);
    let port = 80;
    if (url.port === 'http') {
      port = 80;
    } else if (url.port === 'https') {
      port = 443;
    } else {
      port = parseInt(url.port, 10);
    }

    const useSSL = (url.protocol === 'https');

    this.minioClient = new Client({
        endPoint: url.hostname,
        port,
        useSSL,
        accessKey: options.accessKey,
        secretKey: options.secretKey
    });
  }

  public async getStream(
    prefix: string,
    options?: {tailLines?: number}
  ): Promise<Stream> {
    const {tailLines} = options || {tailLines: 0};

    return this.getAllFiles(prefix).then(objs => {
      objs.sort((obj1, obj2) => {
        return obj1.lastModified.getUTCMilliseconds() - obj2.lastModified.getUTCMilliseconds();
      });
      if (objs.length > 10) {
        objs = objs.slice(objs.length - 10, objs.length);
      }
      return objs;
    }).then(objs => {
      // tslint:disable-next-line: no-console
      console.log(objs);
      return Promise.all(objs.map(async obj => {
        let stream = await this.minioClient.getObject(this.bucket, obj.name);
        if (obj.name.endsWith('.gz')) {
          stream = stream.pipe(createGunzip());
        }
        return stream;
      }));
    }).then(readStream => {
        const combinedStream = CombinedStream.create();
        readStream.forEach(stream => {
            combinedStream.append(stream as Readable);
        });

        if (tailLines > 0) {
          return combinedStream.pipe(split()).pipe(new TailStream(tailLines));
        } else {
          return combinedStream;
        }
    });
  }

  private getAllFiles(dirname) {
    return new Promise<BucketItem[]>((resolve, reject) => {
        const list: BucketItem[] = [];
        const stream = this.minioClient.listObjects(this.bucket, dirname, true);
        stream.on('data', (obj: BucketItem) => {
            list.push(obj);
        });
        stream.on('error', (error: Error) => {
            reject(error);
        });
        stream.on('end', () => {
            resolve(list);
        });
    });
  }
}
