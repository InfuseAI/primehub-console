import moment, { Moment } from 'moment';

import type { TInstanceType } from 'admin/InstanceTypes';
import type { Image as TImage } from 'admin/Images';
import type { JobPhase } from './types';

type Image = Omit<TImage, 'logEndpoint' | 'imageSpec' | 'jobStatus'>;

export function computeDuration(start: Moment | null, finish: Moment | null) {
  if (!start || !finish) {
    return '-';
  }

  function ensureFormat(str: number) {
    const n = str < 0 ? 0 : str;
    return String(n).length === 1 ? `0${str}` : str;
  }

  const duration = moment.duration(finish.diff(start));
  const hour = ensureFormat(Math.floor(duration.asHours()));
  const minutes = ensureFormat(duration.minutes());
  const seconds = ensureFormat(duration.seconds());

  return `${hour}:${minutes}:${seconds}`;
}

export function transformImages(
  images: Image[],
  instanceType?: Omit<
    TInstanceType,
    'nodeSelector' | 'tolerations' | 'cpuRequest' | 'memoryRequest'
  >
) {
  const gpuInstance = Boolean(instanceType?.gpuLimit);

  return images.map(image => {
    return {
      ...image,
      __disabled:
        !image.isReady || (!gpuInstance && image.type.toLowerCase() === 'gpu'),
    };
  });
}

export function getImageType(image?: Image) {
  const imageType = image?.type?.toLowerCase() || '';

  switch (imageType) {
    case 'gpu':
      return 'GPU';
    case 'cpu':
      return 'CPU';
    case 'both':
      return 'Universal';
    default:
      return 'Unknown';
  }
}

export function dashOrNumber(value: string | null) {
  return value === null ? '-' : value;
}

export function stringifyZone({
  name,
  offset,
}: {
  name: string;
  offset: number;
}) {
  const ensure2Digits = num => (num > 9 ? `${num}` : `0${num}`);

  return `GMT${offset < 0 ? '-' : '+'}${ensure2Digits(
    Math.floor(Math.abs(offset))
  )}:${ensure2Digits(Math.abs((offset % 1) * 60))}, ${name}`;
}

export function getCreateTimeAndFinishTime(
  startTime: string,
  finishTime: string,
  phase: JobPhase
) {
  function renderTimeIfValid(time: string) {
    if (!time) {
      return '-';
    }

    const momentTime = moment(time);
    return momentTime.isValid()
      ? momentTime.format('YYYY-MM-DD HH:mm:ss')
      : '-';
  }

  switch (phase) {
    case 'Pending':
    case 'Preparing':
      return {
        startTime: '-',
        finishTime: '-',
      };

    case 'Running':
      return {
        startTime: renderTimeIfValid(startTime),
        finishTime: '-',
      };

    default:
      return {
        startTime: renderTimeIfValid(startTime),
        finishTime: renderTimeIfValid(finishTime),
      };
  }
}

export function getActionByPhase(phase: JobPhase) {
  switch (phase) {
    case 'Pending':
    case 'Preparing':
    case 'Running':
      return 'Cancel';
    case 'Succeeded':
    case 'Cancelled':
    case 'Failed':
    case 'Unknown':
    default:
      return 'Rerun';
  }
}
