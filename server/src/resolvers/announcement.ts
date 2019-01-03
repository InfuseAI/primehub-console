import { Context } from './interface';
import CustomResource, { Item } from '../crdClient/customResource';
import { AnnouncementSpec } from '../crdClient/crdClientImpl';
import { filter, paginate, extractPagination, toRelay } from './utils';
import { isNil, get, isEmpty, isBoolean, forEach, orderBy } from 'lodash';
import moment from 'moment';
import * as logger from '../logger';
import Boom from 'boom';

/**
 * interface
 */
interface AnnResponse {
  id: string;
  title: string;
  content: {html: string};
  expiryDate: string;
  createDate: string;
  sendEmail: boolean;
  status: string;
  global: boolean;
  metadata: any;
  spec: any;
}

/**
 * constants
 */

export const LABEL_PREFIX = 'groups.keycloak';
export const GLOBAL_LABEL = `${LABEL_PREFIX}/gloabl`;

/**
 * utility
 */

const generateName = () => {
  return `ann-${Math.random().toString(36).substring(2, 15)}`;
};

const createMapping = (data: any, name: string) => {
  const labels = {};
  if (data.global) {
    labels[GLOBAL_LABEL] = 'true';
  }

  const groupWhere = get(data, 'groups.connect');
  if (!isEmpty(groupWhere)) {
    groupWhere.forEach(group => {
      labels[`${LABEL_PREFIX}/${group.id}`] = 'true';
    });
  }
  return {
    metadata: {
      name,
      labels
    },
    spec: {
      title:  get(data, 'title'),
      content: get(data, 'content.html', `<p></p>`),
      expiryDate: isNil(data.expiryDate) ? moment.utc().unix() : moment.utc(data.expiryDate).unix(),
      sendEmail: isNil(data.sendEmail) ? undefined : Boolean(data.sendEmail),
      status: isNil(data.status) ? 'draft' : data.status
    }
  };
};

const mapping = (item: Item<AnnouncementSpec>): AnnResponse => {
  return {
    id: item.metadata.name,
    title: item.spec.title,
    content: {html: item.spec.content},
    expiryDate: moment.unix(item.spec.expiryDate).utc().toISOString(),
    createDate: item.metadata.creationTimestamp,
    sendEmail: Boolean(item.spec.sendEmail),
    status: item.spec.status,
    global: get(item, ['metadata', 'labels', GLOBAL_LABEL]) === 'true',
    metadata: item.metadata,
    spec: item.spec
  };
};

const updateMapping = (data: any) => {
  const labels = {};
  if (isBoolean(data.global)) {
    labels[GLOBAL_LABEL] = data.global.toString();
  }

  if (data.groups && data.groups.connect) {
    data.groups.connect.forEach(groupWhere => {
      labels[`${LABEL_PREFIX}/${groupWhere.id}`] = 'true';
    });
  }

  if (data.groups && data.groups.disconnect) {
    data.groups.disconnect.forEach(groupWhere => {
      labels[`${LABEL_PREFIX}/${groupWhere.id}`] = null;
    });
  }

  return {
    metadata: {
      labels: isEmpty(labels) ? undefined : labels
    },
    spec: {
      title: isNil(get(data, 'title')) ? undefined : get(data, 'title'),
      content: isNil(get(data, 'content.html')) ? undefined : get(data, 'content.html'),
      expiryDate: isNil(data.expiryDate) ? undefined : moment.utc(data.expiryDate).unix(),
      sendEmail: isNil(data.sendEmail) ? undefined : Boolean(data.sendEmail),
      status: isNil(data.status) ? undefined : data.status
    }
  };
};

const onPublish = (ann: AnnResponse) => {
  // send emails
};

/**
 * CRUD operations
 */

export const create = async (root, args, context: Context) => {
  const name = generateName();
  const {crdClient} = context;
  const announcements = crdClient.announcements;

  // default properties
  // global default to true if groups not defined
  // status default to draft
  const data = {
    global: args.data.groups ? false : true,
    sendEmail: false,
    status: 'draft',
    ...args.data
  };

  // create crd on k8s
  const {metadata, spec} = createMapping(data, name);
  const res = await announcements.create(metadata, spec);

  logger.info({
    component: logger.components.announcement,
    type: 'CREATE',
    userId: context.userId,
    username: context.username,
    id: res.metadata.name
  });

  const returnAnn = mapping(res);
  if (res.spec.status === 'published') {
    onPublish(returnAnn);
  }

  context.annCache.clear();
  return returnAnn;
};

export const update = async (root, args, context: Context) => {
  const name = args.where.id;
  const {crdClient} = context;
  const announcements = crdClient.announcements;

  // validation
  // cannot rollback from published to draft
  const ann = await announcements.get(name);
  if (ann.spec.status === 'published' && args.data.status === 'draft') {
    throw Boom.forbidden('cannot rollback from published to draft');
  }

  // update crd on k8s
  const {metadata, spec} = updateMapping(args.data);
  const res = await announcements.patch(name, {
    metadata,
    spec
  });

  logger.info({
    component: logger.components.announcement,
    type: 'UPDATE',
    userId: context.userId,
    username: context.username,
    id: res.metadata.name
  });

  // if go from draft to published
  const returnAnn = mapping(res);
  if (ann.spec.status === 'draft' && res.spec.status === 'published') {
    onPublish(returnAnn);
  }

  context.annCache.clear();
  return returnAnn;
};

export const destroy = async (root, args, context: Context) => {
  const name = args.where.id;
  const {crdClient} = context;
  const announcements = crdClient.announcements;

  // delete crd on k8s
  const crd = await announcements.get(name);
  await announcements.del(name);

  logger.info({
    component: logger.components.announcement,
    type: 'DELETE',
    userId: context.userId,
    username: context.username,
    id: name
  });

  context.annCache.clear();
  return mapping(crd);
};

/**
 * Query
 */

const privateQuery = async (rows: Array<Item<AnnouncementSpec>>, where: any) => {
  let mappedRows = rows.map(mapping);

  // filter
  mappedRows = filter(mappedRows, where);

  // sort by date
  mappedRows = orderBy(mappedRows, ['createDate'], ['desc']);
  return mappedRows;
};

export const listQuery = async (root, args, context: Context) => {
  const where = args && args.where;
  const anns = await context.annCache.list();
  const rows = await privateQuery(anns, where);
  return paginate(rows, extractPagination(args));
};

export const connectionQuery = async (root, args, context: Context) => {
  const where = args && args.where;
  const anns = await context.annCache.list();
  const rows = await privateQuery(anns, where);
  return toRelay(rows, extractPagination(args));
};

export const queryOne = async (root, args, context: Context) => {
  const id = args.where.id;
  try {
    const row = await context.annCache.get(id);
    if (!row) {
      return null;
    }
    return mapping(row);
  } catch (e) {
    // if http 404 error
    return null;
  }
};

export const typeResolvers = {
  async groups(parent, args, context: Context) {
    const groupIds = [];
    const labels = get(parent, 'metadata.labels', {});
    forEach(labels, (_, label) => {
      if (label.indexOf(LABEL_PREFIX) >= 0 && label !== GLOBAL_LABEL) {
        groupIds.push(label.split('/')[1]);
      }
    });

    const groups = await groupIds.map(groupId =>
      context.kcAdminClient.groups.findOne({id: groupId}));
    return groups.filter(v => v);
  }
};
