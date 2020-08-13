import React from 'react';
import {Layout, Menu, Badge} from 'antd';
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
  width: 25px;
  height: 25px;
`;

const Title = styled.span`
  margin-left: 16px;
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
              <Badge count={'Beta'} offset={[0, 8]} style={{backgroundColor: '#adafbe'}}>
                <div style={{width: "120px"}}>
                  <Title>Jobs</Title>
                </div>
              </Badge>
            </Link>
          </Menu.Item>
          <Menu.Item key="schedule">
            <Link to={`${appPrefix}g/${group}/schedule`}>
              <Icon src={iconSchedule}/>
              <Badge count={'Beta'} offset={[0, 8]} style={{backgroundColor: '#adafbe'}}>
                <div style={{width: "120px"}}>
                  <Title>Schedule</Title>
                </div>
              </Badge>
            </Link>
          </Menu.Item>
          <Menu.Item key="model-deployment">
            <Link to={`${appPrefix}g/${group}/model-deployment`}>
              <Icon src={iconModels}/>
              <Badge count={'Alpha'} offset={[0, 8]} style={{backgroundColor: '#adafbe'}}>
                <div style={{width: "120px"}}>
                  <Title>Models</Title>
                </div>
              </Badge>
            </Link>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
    );
  }
}

export default withRouter(Sidebar);
