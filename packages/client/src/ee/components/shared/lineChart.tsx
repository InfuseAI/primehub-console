import React from 'react';
import {
  Chart,
  PointElement,
  LineController,
  LinearScale,
  TimeScale,
  Tooltip,
  LineElement,
} from 'chart.js';

import 'chartjs-adapter-moment';

Chart.register(
  LineElement,
  LineController,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip
);

type Props = {
  title: string;
  datasets?: any[]; // x values
  labels?: any[]; // y values
  multiple?: boolean; // legend shows or not
};

type States = {
  chart: Chart
};

class LineChart extends React.Component<Props, States> {
  chartRef: any;
  config: any;

  constructor(props: Props) {
    super(props);
    const { title, multiple } = props;
    this.state = {
      chart: undefined,
    };
    this.chartRef = React.createRef();
    this.config = {
      type: 'line',
      options: {
        aspectRatio: 1.25,
        title: {
          display: true,
          text: title,
          fontSize: 14,
        },
        animation: {
          duration: 0,
        },
        legend: {
          display: multiple,
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            type: 'time',
            display: true,
            time: {
              tooltipFormat: 'YYYY/MM/DD HH:mm:ss',
              unit: 'minute',
              minUnit: 'minute',
            },
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            grid: {
              color: 'rgba(200, 200, 200, 0.5)',
            },
            min: 0,
          },
        },
      },
      data: {
        labels: [],
        datasets: [
          {
            data: [],
          },
        ],
      },
    };
  }

  public componentDidMount = () => {
    const chart = new Chart(this.chartRef.current, this.config);
    this.setState({ chart });
  };

  public render = () => {
    const { datasets, labels } = this.props;
    const { chart } = this.state;
    if (chart && datasets && labels) {
      for (let i = 0; i < datasets.length; i++) {
        if (!datasets[i].fill) {
          datasets[i].fill = false;
        }
      }
      this.config.data.labels = labels;
      this.config.data.datasets = datasets;
      chart.update();
    }
    return <canvas ref={this.chartRef} />;
  };
}

export default LineChart;
