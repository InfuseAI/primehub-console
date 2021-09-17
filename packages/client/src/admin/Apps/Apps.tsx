import * as React from 'react';
import { get } from 'lodash';
import {
  Icon,
  Layout,
  Card,
  Row,
  Col,
  Button,
  Input,
  Typography,
  Tag,
  Divider,
  notification,
} from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import { errorHandler } from 'utils/errorHandler';
import Breadcrumbs from 'components/share/breadcrumb';
import PhAppTemplate from 'interfaces/phAppTemplate';
import { ActionBtn, ClearBoth, Left } from 'components/apps/detail';
import { GetPhAppTemplates } from 'queries/PhAppTemplate.graphql';
import AppLogo from 'components/apps/appLogo';

import { ImportPhAppTemplateFromURL } from './apps.graphql';

const { Search } = Input;
const { Text } = Typography;

const GITHUB_REGEX =
  /^https:\/\/github.com\/([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)\/blob\/(.+)/;
const GITHUB_REGEX_REPLACE_VALUE = 'https://raw.githubusercontent.com/$1/$2';

interface Props {
  getPhAppTemplates: any;
  importPhAppTemplateFromURL: ({
    variables,
  }: {
    variables: { url: string };
  }) => Promise<void>;
}

function _Apps({ ...props }: Props) {
  const importURL = React.useRef(null);
  const { getPhAppTemplates } = props;
  const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates', []);

  const [filteredTemplates, setFilteredTemplates] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');

  const filtered: PhAppTemplate[] = phAppTemplates.filter(template => {
    const title = template.name;
    const description = template.description || '';
    const index = title.toLowerCase().indexOf(searchText.toLowerCase());
    const descIndex = description
      .toLowerCase()
      .indexOf(searchText.toLowerCase());
    return index >= 0 || descIndex >= 0;
  });

  React.useEffect(() => {
    setFilteredTemplates(filtered);
  }, [phAppTemplates]);

  React.useEffect(() => {
    setFilteredTemplates(filtered);
  }, [searchText]);

  const onSearch = (text: string): void => {
    setSearchText(text);
  }

  const PageHead = () => (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
      }}
    >
      <Breadcrumbs
        pathList={[
          {
            key: 'apps',
            matcher: /\/apps/,
            title: 'Apps',
          },
        ]}
      />
    </div>
  );

  return (
    <Layout>
      <PageHead />
      <div
        style={{
          margin: '16px 16px 0 16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <div
          style={{
            color: 'rgba(0, 0, 0, 0.85)',
            paddingBottom: '16px',
            fontWeight: 500,
            fontSize: '16px',
          }}
        >
          Import Custom App Template YAML from URL
        </div>
        <div
          style={{
            display: 'flex',
            width: '100%',
          }}
        >
          <Input
            ref={importURL}
            data-testid='import-template-url'
            placeholder='Copy and Paste Application URL'
          />
          <Button
            type='primary'
            data-testid='import-template-button'
            onClick={async () => {
              let url = importURL.current.input.value;
              if (url) {
                url = url.replace(GITHUB_REGEX, GITHUB_REGEX_REPLACE_VALUE);
                props.importPhAppTemplateFromURL({ variables: { url } });
              }
            }}
            style={{ marginLeft: '16px' }}
          >
            Import
          </Button>
        </div>
      </div>
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <div
          style={{
            color: 'rgba(0, 0, 0, 0.85)',
            paddingBottom: '16px',
            fontWeight: 500,
            fontSize: '16px',
          }}
        >
          Available Apps
        </div>
        <Row gutter={24} type='flex' style={{ marginBottom: '16px' }}>
          <Col xs={24} md={12} xl={12} xxl={8}>
            <Search
              placeholder='Search application'
              onChange={e => onSearch(e.currentTarget.value)}
              onSearch={onSearch}
            />
          </Col>
        </Row>
        <Row gutter={24} type='flex'>
          {filteredTemplates.map((appTemplate: PhAppTemplate): JSX.Element => {
            const title = appTemplate.name;
            const imageTag = get(
              appTemplate,
              'template.spec.podTemplate.spec.containers[0].image',
              'unknown'
            );
            const description = appTemplate.description || '';
            const index = title.toLowerCase().indexOf(searchText.toLowerCase());
            const descIndex = description
              .toLowerCase()
              .indexOf(searchText.toLowerCase());
            const text =
              index >= 0 ? (
                <span>
                  {title.substr(0, index)}
                  <b
                    style={{
                      background: '#faad14',
                    }}
                  >
                    {title.substr(index, searchText.length)}
                  </b>
                  {title.substr(index + searchText.length)}
                </span>
              ) : (
                title
              );
            const desc =
              descIndex >= 0 ? (
                <span>
                  {description.substr(0, descIndex)}
                  <b
                    style={{
                      background: '#faad14',
                    }}
                  >
                    {description.substr(descIndex, searchText.length)}
                  </b>
                  {description.substr(descIndex + searchText.length)}
                </span>
              ) : (
                description
              );

            return (
              <Col xs={24} span={12} md={12} xxl={8} key={appTemplate.id} style={{ marginBottom: 16 }}>
                <Card style={{ borderRadius: '4px' }}>
                  <Left>
                    <AppLogo src={appTemplate.icon} style={{ marginRight: '8px' }}/>
                  </Left>
                  <h2 style={{ margin: '4px 0 0' }}>{text} <Text type='secondary' style={{ fontSize: 12 }}>{appTemplate.version}</Text></h2>
                  <Tag>{imageTag}</Tag>
                  <ClearBoth/>
                  <div>{desc}</div>
                  <Divider style={{ margin: '8px 0' }}/>
                  <div style={{ marginBottom: 0 }}>
                    <Left>
                      <ActionBtn href={`${appTemplate.docLink}`} target='_blank'>
                        <Icon type='read' /> App Documents
                      </ActionBtn>
                    </Left>
                    <ClearBoth />
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </Layout>
  );
}

export const Apps = compose(
  graphql(ImportPhAppTemplateFromURL, {
    name: 'importPhAppTemplateFromURL',
    options: () => ({
      refetchQueries: [{ query: GetPhAppTemplates }],
      onCompleted: data => {
        const name = get(data, 'importPhAppTemplateFromURL.metadata.name', '');
        notification.success({
          duration: 5,
          placement: 'bottomRight',
          message: 'Successfully imported!',
          description: `PhAppTemplate '${name}' imported`,
        });
      },
      onError: errorHandler,
    }),
  }),
  graphql(GetPhAppTemplates, {
    name: 'getPhAppTemplates',
    alias: 'withPhAppTemplates',
  })
)(_Apps);
