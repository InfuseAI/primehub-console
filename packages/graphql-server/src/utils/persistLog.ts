import { Stream, Readable } from 'stream';
import {Client, BucketItem} from 'minio';
import CombinedStream from 'combined-stream';
import { createGunzip } from 'zlib';
import split from 'split';
import TailStream from './stream';

const MAX_SIZE = 64 * 1024 * 1024;
const MAX_FILES = 7 * 24;

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
    options: {tailLines?: number} = {}
  ): Promise<Stream> {
    const {tailLines} = {
      tailLines: 0,
      ...options
    };

    return this.getAllFiles(prefix).then(objs => {
      objs.sort((obj1, obj2) => {
        return obj1.lastModified.getTime() - obj2.lastModified.getTime();
      });

      let byteCount = 0;
      let objCount = 0;

      const maxSize = tailLines === 0 ?
        MAX_SIZE :
        Math.min(32 * tailLines, MAX_SIZE);

      for (let i = objs.length - 1; i >= 0; i--) {
          const obj = objs[i];
          byteCount += obj.name.endsWith('.gz') ? obj.size * 8 : obj.size;
          objCount ++;

          if (byteCount >= maxSize || objCount >= MAX_FILES) {
            break;
          }
      }

      if (objs.length !== objCount) {
        objs = objs.slice(objs.length - objCount, objs.length);
      }
      return objs;
    }).then(objs => {
      // tslint:disable-next-line: no-console
      return Promise.all(objs.map(async obj => {
        return next => {
          this.minioClient.getObject(this.bucket, obj.name).then(stream => {
            if (obj.name.endsWith('.gz')) {
              stream = stream.pipe(createGunzip());
            }
            next(stream);
          });
        };
      }));
    }).then(readStream => {
        const combinedStream = CombinedStream.create();
        readStream.forEach(stream => {
            combinedStream.append(stream);
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
