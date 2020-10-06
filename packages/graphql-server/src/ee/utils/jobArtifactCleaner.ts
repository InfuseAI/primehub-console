import { Client as MinioClient, BucketItem} from 'minio';
import * as logger from '../../logger';
import { Stream } from 'stream';
import getStream from 'get-stream';

const getStringFromStream = (stream) => {

}

export default class JobArtifactCleaner {
  private minioClient: MinioClient;
  private bucket: string;

  constructor(minioClient: MinioClient, bucket: string) {
    this.minioClient = minioClient;
    this.bucket = bucket;
  }

  public cleanUp = async () => {
    logger.info({type: 'JOB_ARTIFACT_CLEANUP_START'});

    // const prefix = `groups/${groupName}/jobArtifacts/${phjobID}`;

    const groups = await this.listGroup();
    groups.forEach(group => {
      this.cleanArtifactsByGroup(group);
    });

    try {
      logger.info({type: 'JOB_ARTIFACT_CLEANUP_COMPLETED'});
    } catch (e) {
      logger.error({type: 'JOB_ARTIFACT_CLEANUP_FAILED'});
    }
  }

  private listGroup = async (): Promise<string[]> => {
    const prefix = `groups/`;
    const groups = [];
    return new Promise<string[]> ((resolve, reject) => {
      const stream = this.minioClient.listObjects(this.bucket, prefix, false);
      stream.on('data', (obj: BucketItem) => {
        const group = obj.prefix.split('/')[1];
        groups.push(group);
      });
      stream.on('error', (error: Error) => {
        reject(error);
      });
      stream.on('end', () => {
        resolve(groups);
      });
    });
  }

  private cleanArtifactsByGroup = async group => {
    const prefix = `groups/${group}/jobArtifacts/`;
    const promises = [];
    await new Promise<string[]> ((resolve, reject) => {
      const stream = this.minioClient.listObjects(this.bucket, prefix, false);
      stream.on('data', async (obj: BucketItem) => {
        const job = obj.prefix.split('/')[3];
        promises.push(this.cleanArtifact(obj));
      });
      stream.on('error', (error: Error) => {
        reject(error);
      });
      stream.on('end', () => {
        resolve();
      });
    });

    return Promise.all(promises);
  }

  private cleanArtifact = async jobObj => {
    const job = jobObj.prefix.split('/')[3];
    const expiredAt = await this.getExpiredAt(jobObj.prefix);

    if ( expiredAt && expiredAt < Date.now() / 1000) {
      logger.info({job, expiredAt, delete: 'true'});
    } else {
      logger.info({job, expiredAt});
    }
  }

  private getExpiredAt = async (jobPrefix): Promise<number> => {
    const expiredAtFile = `${jobPrefix}.metadata/expiredAt`;
    try {
      const stream: Stream = await this.minioClient.getObject(this.bucket, expiredAtFile);
      const result = await getStream(stream);
      return Number(result);
    } catch (e) {
      // file not found
      return 0;
    }
  }
}
