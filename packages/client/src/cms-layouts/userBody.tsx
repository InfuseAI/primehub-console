import * as React from 'react';
import {Breadcrumb, Icon, Button} from 'antd';
import {Item} from 'canner-helpers';
import {get, startCase} from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import PHTooltip from 'components/share/toolTip';
import AddButton from './addButtton';
import {Props} from '../cms-components/types';

function getRouteName(key) {
  switch (key) {
    case 'buildImage':
      return 'Image Builder';
    case 'system':
      return startCase(key);
    default:
      return `${startCase(key)}s`;
  }
}

type Keys = 'user';
type BreadcrumbWithTooptip = Record<Keys, { title: string; link: string }>;
const breadcrumbWithTooltip: BreadcrumbWithTooptip = {
  user: {
    title: 'Admin can find and manage user accounts here.',
    link: 'https://docs.primehub.io/docs/guide_manual/admin-user',
  },
};

@injectIntl
export default class UserBody extends React.Component<Props> {
  state = {
    emailFormVisible: false,
  }

  sendEmailCallback: Function

  registerSendEmailCallback = sendEmailCallback => {
    this.sendEmailCallback = sendEmailCallback;
  }

  onClickSendEmail = () => {
    this.sendEmailCallback && this.sendEmailCallback();
  }

  back = () => {
    const {goTo, routes, routerParams} = this.props;
    const groupId = get(routerParams, 'payload.backToGroup', '');
    if (groupId) {
      goTo({
        pathname: `group/${groupId}`,
        operator: 'update',
      });
    } else {
      goTo({
        pathname: routes[0],
      })
    }
  }

  add = () => {
    const {goTo, routes} = this.props;
    goTo({
      pathname: `${routes[0]}`,
      operator: 'create'
    });
  }

  render() {
    const {title, description, schema, routes, routerParams, keyName} = this.props;
    const {emailFormVisible, selectedRowKeys} = this.state;
    const key = routes[0];
    const item = schema[key];
    const breadcrumbs = [
      {
        path: 'home',
        render: () => <Icon type="home" />,
      },
      {
        path: routes[0],
        render: () => (
          <>
            {getRouteName(routes[0])}
            <PHTooltip
              placement="bottom"
              tipText={breadcrumbWithTooltip[key].title}
              tipLink={breadcrumbWithTooltip[key].link}
              style={{ marginLeft: '5px' }}
            />
          </>
        ),
      },
    ];
    const itemRender = (route) => {
      return route.render();
    }

    const sendEmailText = (
      <FormattedMessage
        id="array.table.sendEmailText"
        defaultMessage="Send Email"
      />
    );

    return (
      <div>
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #eee',
            padding: '16px 24px',
          }}
        >
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <Breadcrumb itemRender={itemRender} routes={breadcrumbs} />
          </div>
          <h2>{item.title || title}</h2>
          {(item.description || description) && (
            <div
              style={{
                marginTop: 8,
              }}
            >
              {item.description || description}
            </div>
          )}
        </div>
        <div
          style={{
            margin: '16px',
            padding: '16px',
            background: '#fff',
          }}
        >
          <Button
            onClick={this.back}
            style={{
              marginBottom: 16,
              minWidth: 99,
              display:
                routerParams.operator === 'create' || routes.length > 1
                  ? undefined
                  : 'none',
            }}
          >
            <Icon type="arrow-left" />
            Back
          </Button>
          <Button.Group
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'flex-end',
              textAlign: 'right',
            }}
          >
            <Button
              onClick={this.onClickSendEmail}
              data-testid="mail-button"
              style={{
                display:
                  routes.length === 1 && routerParams.operator !== 'create'
                    ? undefined
                    : 'none',
              }}
            >
              <Icon
                type="mail"
                theme="outlined"
                style={{
                  position: 'relative',
                  top: 1,
                }}
              />
              {sendEmailText}
            </Button>
            <AddButton
              add={this.add}
              display={
                routes.length === 1 && routerParams.operator !== 'create'
                  ? 'flex'
                  : 'none'
              }
              style={{
                marginLeft: 0,
              }}
            />
          </Button.Group>
          <Item
            hideBackButton
            registerSendEmailCallback={this.registerSendEmailCallback}
          />
        </div>
      </div>
    );
  }
}
