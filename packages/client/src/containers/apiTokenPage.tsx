import React from 'react';
import {
  Layout,
  Card,
  Button,
  Row,
  Input,
  message,
  Modal,
  Typography,
} from 'antd';
import { GetApiTokenCount, RevokeApiToken } from 'queries/ApiToken.graphql';
import PageTitle from 'components/pageTitle';
import { ApolloConsumer } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { errorHandler } from 'utils/errorHandler';
import Breadcrumbs, { BreadcrumbItemSetup } from 'components/share/breadcrumb';
import FileSaver from 'file-saver';
import { GroupContext, GroupContextValue } from 'context/group';
import { useClipboard } from 'hooks/useClipboard';
import { useContext } from 'react';

const breadcrumbs: BreadcrumbItemSetup[] = [
  {
    key: 'api-token',
    matcher: /\/api-token/,
    title: 'API Token',
    tips: 'A valid token is mandatory to allow 3rd-party using PrimeHub APIs.',
    tipsLink: 'https://docs.primehub.io/docs/tasks/api-token',
  },
];

export default function ApiTokenPage() {
  const graphqlEndpoint = window.absGraphqlEndpoint;
  const apiToken = window.apiToken;
  const example = `\nAPI_TOKEN="${apiToken ? apiToken : '<API TOKEN>'}"

curl -X POST \\
  -H 'Content-Type: application/json' \\
  -H "authorization: Bearer \${API_TOKEN}" \\
  -d '{"query":"{me{id,username}}"}' \\
  ${graphqlEndpoint}`;
  const groupContext = useContext(GroupContext);
  const [statusCopyToken, copyToken] = useClipboard({
    text: apiToken,
    timeout: 2000,
  });
  const [, copyExample] = useClipboard({
    text: example,
    timeout: 2000,
  });

  const handleRequestApiToken = async (client: ApolloClient<any>) => {
    const requestApiTokenEndpoint = window.requestApiTokenEndpoint;

    const requestToken = async () => {
      await client.mutate({ mutation: RevokeApiToken });
      const backUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `${requestApiTokenEndpoint}?backUrl=${backUrl}`;
    };

    try {
      const result = await client.query({
        query: GetApiTokenCount,
        fetchPolicy: 'no-cache',
      });
      if (result.data?.me?.apiTokenCount == 0) {
        // request token right away
        await requestToken();
      } else {
        // show dialog if there is existing token
        Modal.confirm({
          title: 'Are you sure you want to request an API token?',
          content: 'Submitting a new request will revoke your existing token.',
          maskClosable: true,
          onOk: async () => {
            try {
              await requestToken();
            } catch (err) {
              errorHandler(err);
            }
          },
        });
      }
    } catch (err) {
      errorHandler(err);
    }
  };

  const handleDownloadConfig = (groupContext: GroupContextValue) => {
    const { id, name, displayName } = groupContext;
    const config = {
      endpoint: graphqlEndpoint,
      'api-token': apiToken,
      group: {
        id,
        name,
        displayName,
      },
    };

    const blob = new Blob([JSON.stringify(config)], {
      type: 'text/plain;charset=utf-8',
    });

    FileSaver.saveAs(blob, 'config.json');
  };

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title='API Token'
      />
      <Row style={{ margin: '16px 24px' }}>
        <Card title='Token'>
          {apiToken && (
            <>
              <Input
                readOnly
                style={{ marginBottom: 16 }}
                defaultValue={apiToken}
                addonAfter={
                  <a
                    onClick={() => {
                      copyToken();
                      message.success('copied');
                    }}
                    style={{ color: 'black' }}
                  >
                    {statusCopyToken === 'copied' ? 'Copied' : 'Copy'}
                  </a>
                }
              />

              <Row style={{ marginBottom: 16 }}>
                Please save this token. You won't be able to access it again.
                You can also download the config file for{' '}
                <a
                  target='_blank'
                  href='https://github.com/infuseai/primehub-python-sdk'
                  rel='noreferrer'
                >
                  {' '}
                  PrimeHub CLI/SDK
                </a>{' '}
                and save it at{' '}
                <Typography.Text code>~/.primehub/config.json</Typography.Text>.
              </Row>
            </>
          )}
          <ApolloConsumer>
            {client => (
              <Button
                data-testid='request-button'
                type='primary'
                onClick={() => handleRequestApiToken(client)}
              >
                Request API Token
              </Button>
            )}
          </ApolloConsumer>

          {apiToken && (
            <Button
              data-testid='download-button'
              style={{ marginLeft: 8 }}
              onClick={() => handleDownloadConfig(groupContext)}
            >
              Download Config
            </Button>
          )}
        </Card>
        <Card title='Example' style={{ margin: '16px 0' }}>
          <Button
            icon='copy'
            onClick={() => {
              copyExample();
              message.success('copied');
            }}
            style={{
              float: 'right',
              top: 32,
              marginTop: -32,
              zIndex: 10,
              position: 'relative',
              color: '#ccc',
              borderColor: '#ccc',
            }}
            type='ghost'
          ></Button>
          <Input.TextArea
            style={{
              whiteSpace: 'nowrap',
              background: 'black',
              color: '#ddd',
              fontFamily: 'monospace',
            }}
            rows={9}
            value={example}
          />
        </Card>
      </Row>
    </Layout>
  );
}
