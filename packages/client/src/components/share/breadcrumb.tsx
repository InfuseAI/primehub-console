import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';
import {compose} from 'recompose';

type BreadcrumbItemSetup = {
  key: string,
  matcher: RegExp,
  title: string,
  link: string
};

type Props = RouteComponentProps & {
  pathList?: Array<BreadcrumbItemSetup>;
}

const parseBreadcrumb = (match: any, basename: string, items: Array<BreadcrumbItemSetup>) => {
  const result = [];
  if(items) {
    items.forEach((item) => {
      const {key, matcher, title, link} = item;
      if(matcher && matcher.test(match.url)) {
        result.push(<Breadcrumb.Item key={key}>
          {
            !!link ? <Link to={`${basename}${link}`}>{title}</Link> : title
          }
        </Breadcrumb.Item>);
      }
    });
  }
  return result;
}

class Breadcrumbs extends React.Component<Props> {
  render() {
    const { match, pathList } = this.props;
    const params = match.params as any;
    const basename = params.groupName ? `${appPrefix}g/${params.groupName}` : `${appPrefix}`;
    const breadcrumbItems = [
      <Breadcrumb.Item key="home">
        {
          params.groupName ?
          <Link to={`${basename}`}><Icon type="home" /></Link> :
          <a href={`${basename}`}><Icon type="home" /></a>
        }

      </Breadcrumb.Item>,
      ...parseBreadcrumb(match, basename, pathList)
    ];

    return (
      <Breadcrumb style={{marginBottom: 8}}>
        {breadcrumbItems}
      </Breadcrumb>
    );
  }
}

export default compose(withRouter)(Breadcrumbs);
