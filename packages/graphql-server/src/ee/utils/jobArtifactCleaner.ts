import { Client as MinioClient, BucketItem} from 'minio';
import * as logger from '../../logger';
import { Stream } from 'stream';
import getStream from 'get-stream';
import { toGroupPath } from '../../utils/groupCheck';

const CLEANUP_INTERVAL_SECONDS = 86400;

export default class JobArtifactCleaner {
  private minioClient: MinioClient;
  private bucket: string;

  constructor(minioClient: MinioClient, bucket: string) {
    this.minioClient = minioClient;
    this.bucket = bucket;
  }

  // Cleanup expired artifacts
  public cleanUp = async () => {
    logger.info({type: 'JOB_ARTIFACT_CLEANUP_START'});
    try {
      const groups = await this.listGroup();
      for (const group of groups) {
        await this.cleanArtifactsByGroup(group);
      }

      logger.info({type: 'JOB_ARTIFACT_CLEANUP_COMPLETED'});
    } catch (e) {
      logger.error({type: 'JOB_ARTIFACT_CLEANUP_FAILED', error: e});
    }
  }

  // Start the timer to clean up the artifacts periodically
  public start = async () => {
    setInterval(this.cleanUp, CLEANUP_INTERVAL_SECONDS * 1000);
  }

  private listGroup = async (): Promise<string[]> => {
    const prefix = `groups/`;
    const groups = [];
    return new Promise<string[]> ((resolve, reject) => {
      const stream = this.minioClient.listObjectsV2(this.bucket, prefix, false);
      stream.on('data', (obj: BucketItem) => {
        if (obj.prefix) {
          const group = obj.prefix.split('/')[1];
          groups.push(group);
        }
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
    group = toGroupPath(group);
    const prefix = `groups/${group}/jobArtifacts/`;
    const promises = [];
    await new Promise<string[]> ((resolve, reject) => {
      const stream = this.minioClient.listObjectsV2(this.bucket, prefix, false);
      stream.on('data', async (obj: BucketItem) => {
        if (obj.prefix) {
          const job = obj.prefix.split('/')[3];
          promises.push(this.cleanArtifactsByJob(obj));
        }
      });
      stream.on('error', (error: Error) => {
        reject(error);
      });
      stream.on('end', () => {
        resolve();
      });
    });

    return Promise.all(promises)
    .then(values => {
      // sum up all the results
      let jobDeleted = 0;
      for (const value of values) {
        jobDeleted += value;
      }
      logger.info({type: 'JOB_ARTIFACT_CLEAN_GROUP_COMPLETED', group, jobDeleted});
    })
    .catch(e => {
      logger.error({type: 'JOB_ARTIFACT_CLEAN_JOB_FAILED', group});
    });
  }

  private cleanArtifactsByJob = async jobObj => {
    const job = jobObj.prefix.split('/')[3];
    const expiredAt = await this.getExpiredAt(jobObj.prefix);
    if (expiredAt && expiredAt < Date.now() / 1000) {
      const objs = [];
      logger.info({type: 'JOB_ARTIFACT_CLEAN_JOB_START', job});
      try {
        await new Promise<string[]> ((resolve, reject) => {
          const stream = this.minioClient.listObjectsV2(this.bucket, jobObj.prefix, true);
          stream.on('data', async (obj: BucketItem) => {
            objs.push(obj.name);
          });
          stream.on('error', (error: Error) => {
            reject(error);
          });
          stream.on('end', () => {
            resolve();
          });
        });

        await this.minioClient.removeObjects(this.bucket, objs);
        logger.info({type: 'JOB_ARTIFACT_CLEAN_JOB_COMPLETED', job});
        return 1;
      } catch (e) {
        logger.error({type: 'JOB_ARTIFACT_CLEAN_JOB_FAILED', job, error: e});
        return 0;
      }
    }
    return 0;
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
