import { Context } from './interface';
import CustomResource, { Item } from '../crdClient/customResource';
import { AnnouncementSpec } from '../crdClient/crdClientImpl';
import { filter, paginate, extractPagination, toRelay } from './utils';
import { isNil, get, isEmpty, isBoolean, forEach, orderBy, uniq } from 'lodash';
import moment from 'moment';
import * as logger from '../logger';
import Boom from 'boom';
import xss from 'xss';
import BPromise from 'bluebird';
import { EmailClient } from '../announcement/emailClient';
import { keycloakMaxCount } from './constant';

/**
 * interface
 */
interface AnnResponse {
  id: string;
  title: string;
  content: {html: string};
  expirationTimestamp: string;
  creationTimestamp: string;
  sendEmail: boolean;
  status: string;
  global: boolean;
  metadata: any;
  spec: any;
}

/**
 * constants
 */

export const LABEL_PREFIX = 'announcement.primehub.io';
export const GLOBAL_LABEL = `${LABEL_PREFIX}/everyone`;

/**
 * utility
 */

const generateName = () => {
  return `ann-${Math.random().toString(36).substring(2, 15)}`;
};

export const getGroupIdsFromLabels = (labels: any): string[] => {
  const groupIds = [];
  forEach(labels, (_, label) => {
    if (label.indexOf(LABEL_PREFIX) >= 0 && label !== GLOBAL_LABEL) {
      groupIds.push(label.split('/')[1]);
    }
  });
  return groupIds;
};

const createMapping = (data: any, name: string) => {
  const labels = {};
  if (data.global) {
    labels[GLOBAL_LABEL] = true;
  }

  const groupWhere = get(data, 'groups.connect');
  if (!isEmpty(groupWhere)) {
    groupWhere.forEach(group => {
      labels[`${LABEL_PREFIX}/${group.id}`] = true;
    });
  }
  return {
    metadata: {
      name,
      labels
    },
    spec: {
      title:  get(data, 'title'),
      content: xss(get(data, 'content.html', `<p></p>`)),
      expirationTimestamp: isNil(data.expirationTimestamp)
        ? moment.utc().format(moment.defaultFormatUtc)
        : moment.utc(data.expirationTimestamp).format(moment.defaultFormatUtc),
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
    expirationTimestamp: moment.utc(item.spec.expirationTimestamp).format(moment.defaultFormatUtc),
    creationTimestamp: item.metadata.creationTimestamp,
    sendEmail: Boolean(item.spec.sendEmail),
    status: item.spec.status,
    global: get(item, ['metadata', 'labels', GLOBAL_LABEL]) === true,
    metadata: item.metadata,
    spec: item.spec
  };
};

const updateMapping = (data: any) => {
  const labels = {};
  if (isBoolean(data.global)) {
    labels[GLOBAL_LABEL] = Boolean(data.global);
  }

  if (data.groups && data.groups.connect) {
    data.groups.connect.forEach(groupWhere => {
      labels[`${LABEL_PREFIX}/${groupWhere.id}`] = true;
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
      content: isNil(get(data, 'content.html')) ? undefined : xss(get(data, 'content.html')),
      expirationTimestamp: isNil(data.expirationTimestamp)
        ? undefined
        : moment.utc(data.expirationTimestamp).format(moment.defaultFormatUtc),
      sendEmail: isNil(data.sendEmail) ? undefined : Boolean(data.sendEmail),
      status: isNil(data.status) ? undefined : data.status
    }
  };
};

const parseBooleanString = val => val === 'true';
const sendEmail = async (ann: AnnResponse, context: Context) => {
  if (!ann.sendEmail) {
    return;
  }
  // send emails
  const {kcAdminClient, realm} = context;
  const foundRealm = await kcAdminClient.realms.findOne({realm});
  const everyoneGroup = await kcAdminClient.groups.findOne({id: context.everyoneGroupId});
  const smtpPassword = get(everyoneGroup, 'attributes.smtpPassword.0');
  const smtpServer = foundRealm.smtpServer || {} as any;
  const smtpConfig = {
    ...smtpServer,
    port: smtpServer.port && parseInt(smtpServer.port, 10) || 25,
    enableSSL: parseBooleanString(smtpServer.ssl),
    enableStartTLS: parseBooleanString(smtpServer.starttls),
    enableAuth: parseBooleanString(smtpServer.auth),
    username: smtpServer.user,
    password: smtpPassword
  };

  // validate smtpConfig
  if (!smtpConfig.host || !smtpConfig.port) {
    logger.error({
      component: logger.components.emailClient,
      type: 'FAIL_SENDING_ANNOUNCEMENT',
      userId: context.userId,
      username: context.username,
      id: ann.id,
      message: `required email settings to setup`
    });
    return;
  }

  // collect emails
  let emails: string[] = [];
  if (ann.global) {
    // send to everyone
    const users = await kcAdminClient.users.find({
      max: keycloakMaxCount
    });
    users.forEach(user => {
      if (user.email) {
        emails.push(user.email);
      }
    });
  } else {
    const groupIds = getGroupIdsFromLabels(ann.metadata.labels);
    const emailMap = {};
    await BPromise.map(groupIds, async groupId => {
      const members = await context.kcAdminClient.groups.listMembers({
        id: groupId,
        max: keycloakMaxCount
      });
      members.forEach(member => {
        if (member.email) {
          emailMap[member.email] = true;
        }
      });
    });
    emails = Object.keys(emailMap);
  }

  // emailClient
  const emailClient = new EmailClient({smtpConfig});
  await BPromise.map(emails, email => {
    return emailClient.sendMail({
      to: email,
      subject: ann.title,
      content: ann.content.html
    });
  }, {
    concurrency: 5
  });

  // add emailSent to crd
  await context.crdClient.announcements.patch(ann.id, {
    spec: {
      emailSentTimestamp: moment.utc().format(moment.defaultFormatUtc)
    }
  });

  logger.info({
    component: logger.components.announcement,
    type: 'SUCCEED_SENDING_ANNOUNCEMENT',
    userId: context.userId,
    username: context.username,
    id: ann.id,
    emailCount: emails.length
  });
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
    sendEmail(returnAnn, context)
      .catch(error => {
        logger.error({
          component: logger.components.announcement,
          type: 'FAIL_SENDING_ANNOUNCEMENT',
          userId: context.userId,
          username: context.username,
          id: res.metadata.name,
          error
        });
      });
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
    sendEmail(returnAnn, context)
      .catch(error => {
        logger.error({
          component: logger.components.announcement,
          type: 'FAIL_SENDING_ANNOUNCEMENT',
          userId: context.userId,
          username: context.username,
          id: res.metadata.name,
          error
        });
      });
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
  mappedRows = orderBy(mappedRows, ['expirationTimestamp'], ['asc']);
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
    const labels = get(parent, 'metadata.labels', {});
    const groupIds = getGroupIdsFromLabels(labels);
    const groups = await groupIds.map(groupId =>
      context.kcAdminClient.groups.findOne({id: groupId}));
    return groups.filter(v => v);
  }
};
