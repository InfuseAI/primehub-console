import { Stream, Readable } from 'stream';
import {Client, BucketItem} from 'minio';
import CombinedStream from 'combined-stream';
import { createGunzip } from 'zlib';
import split from 'split';
import TailStream from './tailStream';

const MAX_SIZE = 64 * 1024 * 1024;
const MAX_FILES = 2000;

interface PersistLogOptions {
  minioClient: Client;
  bucket: string;
}

export default class PersistLog {
  private minioClient: Client;
  private bucket: string;

  constructor(options: PersistLogOptions) {
    this.minioClient = options.minioClient;
    this.bucket = options.bucket;
  }

  public async getStream(
    prefix: string,
    options: {tailLines?: number} = {}
  ): Promise<Stream> {
    const {tailLines} = {
      tailLines: 0,
      ...options
    };

    // list objects under the prefix
    let objs = await this.listObjects(prefix);
    if (objs.length === 0) {
      // empty stream
      const stream = new Readable();
      stream.push(null);
      return stream;
    }

    // Sort the objects by last modified time
    objs.sort((obj1, obj2) => {
      return obj1.lastModified.getTime() - obj2.lastModified.getTime();
    });

    // Reduce number of objects.
    // Keep the lastest n objects according to file count, bytes count.
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

    // Map the object to stream.
    const streams = objs.map(obj => {
      // here we don't return a stream, but a function to get stream.
      //
      // Ref: https://github.com/felixge/node-combined-stream#usage
      // combinedStream.append(function(next) {
      //   next(fs.createReadStream('file1.txt'));
      // });
      return next => {
        this.minioClient.getObject(this.bucket, obj.name).then(stream => {
          if (obj.name.endsWith('.gz')) {
            stream = stream.pipe(createGunzip());
          }
          next(stream);
        });
      };
    });

    // Combine the streams to a single stream
    const combinedStream = CombinedStream.create();
    streams.forEach(stream => {
        combinedStream.append(stream);
    });

    if (tailLines > 0) {
      return combinedStream.pipe(split()).pipe(new TailStream(tailLines));
    } else {
      return combinedStream;
    }
  }

  private async listObjects(prefix) {
    return new Promise<BucketItem[]>((resolve, reject) => {
        const list: BucketItem[] = [];
        const stream = this.minioClient.listObjectsV2(this.bucket, prefix, true);
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
