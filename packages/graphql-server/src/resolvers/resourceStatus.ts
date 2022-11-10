import { Context } from './interface';
import { corev1KubeClient } from '../crdClient/crdClientImpl';
import * as logger from '../logger';
import { toPrimehubLabel } from '../utils/escapism';
const GiB = Math.pow(1024, 3);
const MiB = Math.pow(1024, 2);
const KiB = 1024;

const converCpuValueToFloat = (value = '0') => {
  const regex = /\d+m$/;
  if (regex.test(value)) {
    return parseFloat(value.replace('m', '')) / 1000;
  } else {
    return parseFloat(value);
  }
};

const converMemResourceToBytes = (mem = '0') => {
  const regexGiB = /\d+Gi?$/;
  const regexMiB = /\d+Mi?$/;
  const regexKiB = /\d+(K|k)i?$/;

  if (regexGiB.test(mem)) {
    return parseFloat(mem.replace('Gi?$', '')) * GiB;
  }
  if (regexMiB.test(mem)) {
    return parseFloat(mem.replace(/Mi?$/, '')) * MiB;
  }
  if (regexKiB.test(mem)) {
    return parseFloat(mem.replace(/(K|k)i?$/, '')) * KiB;
  }
  return parseFloat(mem);
};

const labelStringify = (labels: Record<string, string>) => {
  return Object.keys(labels).map(labelKey => {
    const labelValue = labels[labelKey];
    return `${labelKey}=${labelValue}`;
  }).join(',');
};

export const query = async (group, args, context: Context) => {
  const PENDING = 'Pending';
  const RUNNING = 'Running';
  const groupName = toPrimehubLabel(group.name);
  logger.info({
    component: logger.components.resourceStatus,
    type: 'QUERY',
    message: 'Query using resources of group',
    groupName
  });
  const labelSelector = labelStringify({
    'primehub.io/group': `escaped-${groupName}`,
  });
  const {body: {items}} = await corev1KubeClient.listNamespacedPod(
    context.crdNamespace,
    undefined,
    undefined,
    undefined,
    undefined,
    labelSelector
  );
  const resourceUsing = (items || []).reduce((acc, current) => {
    logger.info({
      component: logger.components.resourceStatus,
      type: 'REDUCE',
      message: 'Checkinng status phase:',
      groupName,
      phase: current.status.phase
    });
    if (current.status.phase === PENDING || current.status.phase === RUNNING) {
      (current.spec.containers || []).forEach(container => {
        acc.cpuUsage += converCpuValueToFloat(container.resources.limits.cpu);
        acc.gpuUsage += converCpuValueToFloat(container.resources.limits['nvidia.com/gpu']);
        acc.memUsage += converMemResourceToBytes(container.resources.limits.memory);
      });
    }
    return acc;
  }, {
    cpuUsage: 0,
    memUsage: 0,
    gpuUsage: 0
  });

  // Convert memUsage to GiB
  resourceUsing.memUsage = +(Math.round(resourceUsing.memUsage / GiB * 10) / 10).toFixed(1);

  return {
    groupId: group.id,
    ...resourceUsing
  };
};
