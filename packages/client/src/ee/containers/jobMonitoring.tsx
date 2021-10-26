import * as React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { errorHandler } from 'utils/errorHandler';
import { get } from 'lodash';
import { Button, Alert, Tooltip, Icon } from 'antd';
import styled from 'styled-components';
import LineChart from 'ee/components/shared/lineChart';

type Props = {
  jobId: string;
  data?: any;
};

const Charts = styled.div`
  div.hidden {
    display: none;
  }
  .chart-row-header {
    text-align: center;
    margin-top: 25px;
    margin-bottom: 0;
  }
  .chart-row {
    display: flex;
    justify-content: center;
  }
  .chart {
    display: block;
    width: 500px;
    height: 400px;
    margin: 0 10px;
    padding: 5px 10px 20px 10px;
  }
`

export const GET_PH_JOB_MONITORING = gql`
  query phJob($where: PhJobWhereUniqueInput!) {
    phJob(where: $where) {
      id
      monitoring
    }
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';
const isMonitoringEnabled = (): boolean => {
  return (
    window.enablePhfs && window.enableJobArtifact && window.enableJobMonitoring
  );
};
const convertToMB = (value: number) => {
  return Math.round(value / 1024 / 1024 * 100) / 100;
}

const colors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

// colors from grafana
const gpuColors = [
  'rgb(115, 169, 98)',
  'rgb(179, 138, 46)',
  'rgb(99, 202, 219)',
  'rgb(237, 121, 53)',
  'rgb(222, 68, 58)',
  'rgb(29, 109, 185)',
  'rgb(177, 59, 159)',
  'rgb(101, 83, 150)',
];

const periods = {
  '15m': '15 mins',
  '1h': '1 hour',
  '3h': '3 hours',
  'lifetime': 'Lifetime'
};

class JobMonitoringContainer extends React.Component<Props> {
  state: any;

  constructor(props) {
    super(props);
    this.state = {period: null};
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    if (!this.props.data || !nextProps.data) {
      return false;
    }
    if ((!this.props.data.phJob && nextProps.data.phJob) || (this.props.data.phJob && nextProps.data.phJob && this.state.period === null)) {
      this.state.period = Object.keys(periods)[0];
      return true;
    }
    if (this.state.period !== nextState.period) { return true; }
    if (
      nextProps.data?.phJob?.monitoring?.datasets &&
      this.props.data?.phJob?.monitoring?.datasets
    ) {
      const period = this.state.period;
      const thisDatasets = this.props.data.phJob.monitoring.datasets;
      const nextDatasets = nextProps.data.phJob.monitoring.datasets;
      if (thisDatasets[period].length > 0 && nextDatasets[period].length > 0) {
        const t1 = thisDatasets[period][thisDatasets[period].length - 1].timestamp;
        const t2 = nextDatasets[period][nextDatasets[period].length - 1].timestamp;
        if (t2 > t1) { return true }
      }
    }
    return false;
  }

  public render = () => {
    return <div style={{minHeight: 480}}>{this.renderContent()}</div>;
  }

  private renderButtons = () => {
    const buttons = []
    Object.keys(periods).forEach(key => {
      buttons.push(
        <Button id={`btn-period-${key}`} className={this.state.period === key ? 'ant-btn-primary' : ''}
          onClick={() => this.setState({period: key})}>
          {periods[key]}
        </Button>
      );
    });
    return (
      <div>
        <Tooltip title={'View the average usage within these most recent time frames.'}>
          <Icon
            type="info-circle"
            theme="filled"
            style={{marginRight: 8}}
          />
        </Tooltip>
        <Button.Group>
          {buttons}
        </Button.Group>
      </div>
    )
  }

  private renderContent = () => {
    const {data} = this.props;
    const {period} = this.state;

    if (!isMonitoringEnabled()) {
      return <Alert
      message='Warning'
      description='Job monitoring is not enabled. Please tell your administrator to enable it.'
      type='warning'
      showIcon
      />;
    }

    if (data.error) {
      return getMessage(data.error);
    }

    let labels = [];
    let cpu_datasets = [];
    let mem_datasets = [];
    let gpu_datasets = [];
    let gpu_mem_datasets = [];

    if (data.phJob && data.phJob.monitoring && data.phJob.monitoring.datasets && period in periods) {
      const datasets = data.phJob.monitoring.datasets;
      // prepare x axes
      labels = datasets[period].map(d => new Date(+(d.timestamp+'000')));
      // prepare datasets for cpu/mem
      cpu_datasets = [{
        borderColor: colors.blue,
        data: datasets[period].map(d => d.cpu_util),
      }]
      mem_datasets = [{
        borderColor: colors.green,
        data: datasets[period].map(d => convertToMB(d.mem_used)),
      }]
      // prepare datasets for gpu
      const gpus = {}
      datasets[period].forEach(dataset => {
        dataset.GPU.filter(f => 'index' in f).forEach(g => {
          if (!gpus[g.index]) {
            gpus[g.index] = {gpu: [], mem: []}
          }
          gpus[g.index].gpu.push(g.gpu_util);
          gpus[g.index].mem.push(convertToMB(g.mem_used));
        });
      });
      Object.keys(gpus).forEach(index => {
        gpu_datasets.push({
          label: `gpu${index}`,
          borderColor: gpuColors[+index % gpuColors.length],
          data: gpus[index].gpu
        });
        gpu_mem_datasets.push({
          label: `gpu${index}`,
          borderColor: gpuColors[+index % gpuColors.length],
          data: gpus[index].mem
        });
      })
    }

    const gpu_class_name = (gpu_datasets.length === 0 && gpu_mem_datasets.length === 0) ? 'hidden' : '';

    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          {this.renderButtons()}
        </div>
        <Charts>
          <div>
            <h3 className="chart-row-header">Overall Usage</h3>
            <div className="chart-row">
              <div className="chart">
                <LineChart title={'CPU'}
                  datasets={cpu_datasets}
                  labels={labels} />
              </div>
              <div className="chart">
                <LineChart title={'Memory (MB)'}
                  datasets={mem_datasets}
                  labels={labels} />
              </div>
            </div>
          </div>
          <div className={gpu_class_name}>
            <h3 className="chart-row-header">GPU Device Usage</h3>
            <div className="chart-row">
              <div className="chart">
                <LineChart title={'GPU'}
                  datasets={gpu_datasets}
                  labels={labels}
                  multiple={true} />
              </div>
              <div className="chart">
                <LineChart title={'Memory (MB)'}
                  datasets={gpu_mem_datasets}
                  labels={labels}
                  multiple={true} />
              </div>
            </div>
          </div>
        </Charts>
      </div>
    )
  }
}

export default graphql(GET_PH_JOB_MONITORING, {
  options: (props: Props) => ({
    variables: {
      where: {
        id: props.jobId
      }
    },
    fetchPolicy: 'network-only',
    pollInterval: 10000,
    onError: errorHandler,
  }),
  skip: !isMonitoringEnabled(),
})
(JobMonitoringContainer);
