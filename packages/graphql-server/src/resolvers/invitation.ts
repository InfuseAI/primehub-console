import KcAdminClient from 'keycloak-admin';
import { createConfig } from '../config';
import { ApolloError } from 'apollo-server';
import { Attributes, FieldType } from './attr';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import * as user from './user';

const config = createConfig();

interface InvitationProps {
  groupId: string;
  invitationToken: string;
  expiredDate: string;
  validation?: boolean;
}

export const queryInvitation = async (root, args, context) => {
  const kcAdminClient = context.kcAdminClient;
  const invitationToken = args.data.invitationToken;
  const invitationKey: string = `invitation-${invitationToken}`;

  const roleName = 'invitation';
  const role = await kcAdminClient.roles.findOneByName({ name: roleName });
  if (!role) {
    throw new ApolloError('INVALID_TOKEN');
  }

  const { attributes } = role;
  // verify token
  let payload: InvitationProps;

  // token doesn;t exist
  if (!attributes[invitationKey]) {
    throw new ApolloError('INVALID_TOKEN');
  }

  try {
    payload = JSON.parse(attributes[invitationKey][0]);
  } catch (error) {
    console.error(error);
    throw new ApolloError('INVALID_TOKEN');
  }

  if (moment().isAfter(moment(payload.expiredDate))) {
    throw new ApolloError('EXPIRED_TOKEN');
  }

  payload.validation = true;
  return payload;
};

export const createUserFromInvitation = async (root, args, context) => {
  const { username, invitationToken } = args.data;
  const kcAdminClient: KcAdminClient = context.kcAdminClient;

  // verify token
  let payload: InvitationProps;
  try {
    payload = await queryInvitation(root, args, context);
  } catch (error) {
    throw error;
  }

  // create the user and set a temporary password
  const password = uuidv4().split('-')[0];
  try {
    const userData = await createUser(username, payload, root, context);
    const resetPasswordInput = {
      id: userData.id,
      password,
      temporary: true,
    };

    await user.resetPassword(root, resetPasswordInput, context);
  } catch (error) {
    throw new ApolloError('BAD_USERNAME');
  }

  // remove the invitation
  await removeInvitation(kcAdminClient, invitationToken);
  console.log(`User[${username}] has been created, ${invitationToken} removed`);
  return { username, password };
};

export const createInvitation = async (root, args, context) => {
  const { data } = args;
  const groupId = data.groupId;

  const kcAdminClient: KcAdminClient = context.kcAdminClient;
  await checkGroup(kcAdminClient, groupId);

  const invitationToken = uuidv4();
  const expiredDate = moment.utc().add(1, 'day').toISOString();
  await updateInvitations(kcAdminClient, invitationToken, {
    groupId,
    invitationToken,
    expiredDate,
  });

  return {
    invitationToken,
  };
};

const removeInvitation = async (
  kcAdminClient: KcAdminClient,
  invitationToken: string
) => {
  await updateInvitations(kcAdminClient, invitationToken, null);
};

const updateInvitations = async (
  kcAdminClient: KcAdminClient,
  invitationToken: string,
  content: InvitationProps
) => {
  const roleName = 'invitation';
  let role = await kcAdminClient.roles.findOneByName({ name: roleName });
  if (!role) {
    await kcAdminClient.roles.create({ name: roleName });
    role = await kcAdminClient.roles.findOneByName({ name: roleName });
  }

  const { attributes } = role;

  // keep invitation-token to group attributes
  const invitationKey: string = `invitation-${invitationToken}`;
  const schema = {};
  schema[invitationKey] = { type: FieldType.string };

  const payload = {};
  payload[invitationKey] = content != null ? JSON.stringify(content) : null;

  const attrs = new Attributes({
    keycloakAttr: attributes,
    schema,
  });
  attrs.mergeWithData(payload);

  console.log(attrs);
  await kcAdminClient.roles.updateById(
    { id: role.id },
    {
      name: roleName,
      attributes: attrs.toKeycloakAttrs(),
    }
  );

  role = await kcAdminClient.roles.findOneByName({ name: roleName });
  console.log('updateInvitations => ', role);
};

async function createUser(
  username: any,
  payload: InvitationProps,
  root: any,
  context: any
) {
  const userCreateInput = {
    data: {
      username,
      email: '',
      sendEmail: false,
      groups: {
        connect: [{ id: payload.groupId }],
      },
    },
  };
  return user.create(root, userCreateInput, context);
}

async function checkGroup(kcAdminClient: KcAdminClient, groupId: any) {
  const groups = await kcAdminClient.groups.find();
  const selectedGroup = groups.filter(g => g.id === groupId);
  if (selectedGroup.length === 0) {
    throw new ApolloError(`invalid groupId: ${groupId}`);
  }
}
