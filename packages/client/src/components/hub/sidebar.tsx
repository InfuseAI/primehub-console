import React from 'react';
import {Layout, Menu} from 'antd';
import {Link} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import { withRouter, RouteComponentProps } from 'react-router';
import styled from 'styled-components';
import iconHome from '../../images/icon-home.svg'
import iconJupyterHub from '../../images/icon-jupyterhub.svg'
import iconJobs from '../../images/icon-jobs.svg'
import iconSchedule from '../../images/icon-schedule.svg'
import iconModels from '../../images/icon-models.svg'

const Icon = styled.img`
  width: 30px;
  height: 30px;
`;

const Title = styled.span`
  margin-left: 16px;
`

const BadgeBeta = styled.sup`
  background-color: #52c41a;
  position: absolute;
  top: 28px;
  left: 32px;
  height: 12px;
  border-radius: 3px;
  padding: 6px 2px 2px 2px;
`

const BadgeAlpha = styled.sup`
  background-color: #b50606;
  position: absolute;
  top: 28px;
  left: 32px;
  height: 12px;
  border-radius: 3px;
  padding: 6px 2px 2px 2px;
`

type Props = RouteComponentProps & {};
class Sidebar extends React.Component<Props> {
  render() {
    const {history, match} = this.props;
    const pathKeyList = ['home', 'hub', 'job', 'schedule', 'model-deployment'];
    let key = '';
    pathKeyList.forEach((val) => {
      if (history.location.pathname.split('/').includes(val)) {
        key = val;
      }
    });
    const group = match.params.groupName;

    return (
      <Layout.Sider style={{paddingTop: 64}}>
        <Menu
          theme="dark"
          selectedKeys={[key]}
        >
          <Menu.Item key="home">
            <Link to={`${appPrefix}g/${group}/home`}>
              <Icon src={iconHome}/>
              <Title>Home</Title>
            </Link>
          </Menu.Item>
          <Menu.Item key="hub">
            <Link to={`${appPrefix}g/${group}/hub`}>
              <Icon src={iconJupyterHub}/>
              <Title>JupyterHub</Title>
            </Link>
          </Menu.Item>
          <Menu.Item key="job">
            <Link to={`${appPrefix}g/${group}/job`}>
              <Icon src={iconJobs}/>
              <BadgeBeta>beta</BadgeBeta>
              <Title>Jobs</Title>
            </Link>
          </Menu.Item>
          <Menu.Item key="schedule">
            <Link to={`${appPrefix}g/${group}/schedule`}>
              <Icon src={iconSchedule}/>
              <BadgeBeta>beta</BadgeBeta>
              <Title>Schedule</Title>
            </Link>
          </Menu.Item>
          <Menu.Item key="model-deployment">
            <Link to={`${appPrefix}g/${group}/model-deployment`}>
              <Icon src={iconModels}/>
              <BadgeAlpha>alpha</BadgeAlpha>
              <Title>Models</Title>
            </Link>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
    );
  }
}

export default withRouter(Sidebar);
