import * as React from 'react';
import Chart from 'chart.js';

type Props = {
  title: string;
  datasets?: any[]; // x values
  labels?: any[];   // y values
  multiple?: boolean; // legend shows or not
};

class LineChart extends React.Component<Props> {
  chartRef: any;
  chart: any;
  config: any;

  constructor(props: Props) {
    super(props);
    const {title, multiple} = props;
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
          xAxes: [{
            gridLines: {
              display: false,
            },
            type: 'time',
            time: {
              displayFormats: {
                minute: 'HH:mm'
              }
            }
          }],
          yAxes: [{
            gridLines: {
              color: "rgba(200, 200, 200, 0.5)",
            },
            ticks: {
              suggestedMin: 0,
            }
          }]
        },
      },
      data: {
        labels: [],
        datasets: [{
          data: [],
        }],
      }
    };
  }

  public componentDidMount = () => {
    this.chart = new Chart(this.chartRef.current, this.config);
  }

  public render = () => {
    const {datasets, labels} = this.props;
    if (this.chart && datasets && labels) {
      for (let i=0; i < datasets.length; i++) {
        if (!datasets[i].fill) { datasets[i].fill = false; }
      }
      this.config.data.labels = labels;
      this.config.data.datasets = datasets;
      this.chart.update();
    }
    return (
      <canvas ref={this.chartRef} />
    )
  } 
}

export default LineChart;
