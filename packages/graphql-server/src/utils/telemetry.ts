import Analytics from 'analytics-node';
import * as logger from '../logger';
import md5 from 'md5';

// the write key is filled in the build time.
const SEGMENT_WRITE_KEY = '';
const HEARTBEAT_DELAY = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL = 30 * 60 * 1000;

export type TraitMiddleware = (traits, next) => void;

export class Telemetry {
  private analytics: Analytics;
  private anonymouseId: string;
  private traitMiddlewares: TraitMiddleware[] = [];

  constructor(userId: string) {
    if (!SEGMENT_WRITE_KEY || !userId) {
      return;
    }

    this.anonymouseId = md5(userId);
    this.analytics = new Analytics(SEGMENT_WRITE_KEY);
  }

  public heartbeat() {
    if (!this.analytics) {
      return;
    }

    logger.info({
      component: logger.components.telemetry,
      type: 'TELEMETRY_HEARTBEAT',
    });

    // iterate through the middlewares and collect the traits
    const traits = {};
    const middlewares = this.traitMiddlewares;
    const runNext = index => {
      if (index < middlewares.length) {
        const middleware = middlewares[index];
        middleware(traits, () => {
          runNext(index + 1);
        });
      } else {
        this.analytics.identify({
          anonymousId: this.anonymouseId,
          traits
        });
      }
    };
    runNext(0);
  }

  public track(event, properties) {
    if (!this.analytics) {
      return;
    }

    this.analytics.track({
      anonymousId: this.anonymouseId,
      event, // e.g. 'Job Completed'
      properties
    });
  }

  public addTraitMiddleware(...middlewares: TraitMiddleware[]) {
    this.traitMiddlewares.push(...middlewares);
  }

  public start() {
    if (!this.analytics) {
      return;
    }

    logger.info({
      component: logger.components.telemetry,
      type: 'TELEMETRY_START',
    });

    setTimeout(() => {
      this.heartbeat();
      setInterval(() => {
        this.heartbeat();
      }, HEARTBEAT_INTERVAL);
    }, HEARTBEAT_DELAY);
  }
}
