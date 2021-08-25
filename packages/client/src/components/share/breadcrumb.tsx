import * as React from 'react';
import styled from 'styled-components';
import { Link, useRouteMatch } from 'react-router-dom';
import { Breadcrumb, Icon, Tooltip } from 'antd';
import { appPrefix } from 'utils/env';
import { LightA } from 'components/share';

const StyledBreadcrumb = styled(Breadcrumb)`
  font-size: 14px;
`;

export interface BreadcrumbItemSetup {
  key: string;
  matcher: RegExp;
  title: string;
  link?: string;
  onClick?: () => void;
  tips?: string | React.ReactNode;
  tipsLink?: string;
}

interface Props {
  pathList?: BreadcrumbItemSetup[];
}

const parseBreadcrumb = (
  match: any,
  basename: string,
  items: BreadcrumbItemSetup[]
) => {
  const result = [];

  if (items) {
    items.forEach((item, index) => {
      const last = index === items.length - 1;
      const { key, matcher, title, link, onClick, tips, tipsLink } = item;

      const tipTitle = (
        <span>
          {tips}{' '}
          {tipsLink ? (
            <LightA target='_blank' href={tipsLink}>
              Learn more
            </LightA>
          ) : (
            <></>
          )}
        </span>
      );

      if (matcher && matcher.test(match.url)) {
        const breadcrumb = (
          <Breadcrumb.Item key={key}>
            <span
              style={{
                fontWeight: last ? 500 : 'initial',
                color: last ? 'rgba(0, 0, 0, 0.65)' : null,
              }}
            >
              {link ? (
                <Link
                  style={{ color: last ? 'rgba(0, 0, 0, 0.65)' : null }}
                  to={`${basename}${link}`}
                >
                  {title}
                </Link>
              ) : onClick ? (
                <a
                  style={{ color: last ? 'rgba(0, 0, 0, 0.65)' : null }}
                  onClick={onClick}
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </span>
            {tips && (
              <span>
                <Tooltip title={tipTitle} placement='right'>
                  <Icon type='question-circle' style={{ marginLeft: 8 }} />
                </Tooltip>
              </span>
            )}
          </Breadcrumb.Item>
        );

        result.push(breadcrumb);
      }
    });
  }
  return result;
};

function Breadcrumbs(props: Props) {
  const { pathList } = props;
  const match = useRouteMatch<{ groupName?: string }>();

  const isAdminPortal = match.path.startsWith('/admin');
  let basename = '';

  if (isAdminPortal) {
    basename = `${appPrefix}admin`;
  } else {
    if (match.params.groupName) {
      basename = `${appPrefix}g/${match.params.groupName}`;
    } else {
      basename = `${appPrefix}`;
    }
  }

  const breadcrumbItems = [
    <Breadcrumb.Item key='home'>
      <Link to={`${basename}`}>
        <Icon type='home' />
      </Link>
    </Breadcrumb.Item>,
    ...parseBreadcrumb(match, basename, pathList),
  ];

  return <StyledBreadcrumb>{breadcrumbItems}</StyledBreadcrumb>;
}

export default Breadcrumbs;
