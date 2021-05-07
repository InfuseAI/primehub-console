import React from 'react';
import {Breadcrumb, Icon, Tooltip} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';
import {compose} from 'recompose';
import styled from 'styled-components';

const StyledBreadcrumb = styled(Breadcrumb)`
  font-size: 14px;
`;

const LightA = styled.a`
  color: #839ce0;
`;

export interface BreadcrumbItemSetup {
  key: string;
  matcher: RegExp;
  title: string;
  link?: string;
  onClick?: any;
  tips?: any;
  tipsLink?: any;
}

type Props = RouteComponentProps & {
  pathList?: BreadcrumbItemSetup[];
};

const parseBreadcrumb = (match: any, basename: string, items: BreadcrumbItemSetup[]) => {
  const result = [];
  if (items) {
    items.forEach((item, index) => {
      const last = index === items.length - 1;
      const {key, matcher, title, link, onClick, tips, tipsLink} = item;
      const tipTitle = <span>{tips} {tipsLink ? <LightA target='_blank' href={tipsLink}>Learn more</LightA> : <></>}</span>;
      if (matcher && matcher.test(match.url)) {
        result.push(<Breadcrumb.Item  key={key}>
          <span style={{fontWeight: (last) ? 500 : 'initial', color: (last) ? 'rgba(0, 0, 0, 0.65)' : null}}>
            {
              !!link ? <Link style={{color: (last) ? 'rgba(0, 0, 0, 0.65)' : null}} to={`${basename}${link}`}>{title}</Link> :
                !!onClick ? <a style={{color: (last) ? 'rgba(0, 0, 0, 0.65)' : null}} onClick={onClick}>{title}</a> :
                title
            }
          </span>
          {
            !!tips ? (
              <span>
                <Tooltip title={tipTitle} placement='right'>
                  <Icon type='question-circle' style={
                    {
                      marginLeft: 8,
                    }
                  }/>
                </Tooltip>
              </span>
            ) : <></>
          }
        </Breadcrumb.Item>);
      }
    });
  }
  return result;
};

class Breadcrumbs extends React.Component<Props> {
  render() {
    const { match, pathList } = this.props;
    const params = match.params as any;
    const basename = params.groupName ? `${appPrefix}g/${params.groupName}` : `${appPrefix}`;
    const breadcrumbItems = [
      <Breadcrumb.Item key='home'>
        {
          params.groupName ?
          <Link to={`${basename}`}><Icon type='home' /></Link> :
          <a href={`${basename}`}><Icon type='home' /></a>
        }

      </Breadcrumb.Item>,
      ...parseBreadcrumb(match, basename, pathList)
    ];

    return (
      <StyledBreadcrumb>
        {breadcrumbItems}
      </StyledBreadcrumb>
    );
  }
}

export default compose(withRouter)(Breadcrumbs);
