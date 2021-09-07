import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen, waitFor } from 'test/test-utils';
import { QueryModel } from 'queries/Model.graphql';
import { GroupContext } from 'context/group';

import ModelDetail from '..';

const MOCK_GROUP_NAME = 'InfuseAICat';
const MOCK_MODEL_NAME = 'test';

beforeEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

function setup() {
  const mockRequests = [
    {
      request: {
        query: QueryModel,
        variables: {
          group: 'InfuseAICat',
          name: 'test',
        },
      },
      result: {
        data: {
          mlflow: {
            trackingUri: 'http://demo-mlflow-abcd:1234/',
            uiUrl: 'https://primehub.io/console/apps/mlflow-abcd',
            __typename: 'MLflowSetting',
          },
          model: {
            name: 'test',
            creationTimestamp: '1619152835332',
            lastUpdatedTimestamp: '1620877810477',
            description: null,
            latestVersions: [
              {
                name: 'test',
                version: '1',
                __typename: 'ModelVersion',
              },
              {
                name: 'test',
                version: '14',
                __typename: 'ModelVersion',
              },
            ],
            __typename: 'Model',
          },
          modelVersions: [
            {
              name: 'test',
              version: '1',
              creationTimestamp: '1619152835488',
              lastUpdatedTimestamp: '1619153130564',
              deployedBy: [],
              __typename: 'ModelVersion',
              run: {
                info: {
                  runId: '123',
                  experimentId: '1',
                  status: 'FINISHED',
                  startTime: '1619081517337',
                  endTime: '1619081558454',
                  artifactUri:
                    '/project/infuseaicat/phapplications/mlflow-abcd/mlruns/1/1/artifacts',
                  lifecycleStage: 'active',
                },
                data: {
                  metrics: [
                    {
                      key: 'loss',
                      value: 0.09649666398763657,
                      timestamp: '1619081554665',
                      step: '1',
                    },
                    {
                      key: 'accuracy',
                      value: 0.9710166454315186,
                      timestamp: '1619081554665',
                      step: '1',
                    },
                    {
                      key: 'foo',
                      value: 2.074806616185172,
                      timestamp: '1619081558220',
                      step: '0',
                    },
                  ],
                  params: [
                    {
                      key: 'batch_size',
                      value: 'None',
                    },
                    {
                      key: 'class_weight',
                      value: 'None',
                    },
                    {
                      key: 'epochs',
                      value: '2',
                    },
                  ],
                  tags: [
                    {
                      key: 'mlflow.user',
                      value: 'tmp',
                    },
                    {
                      key: 'mlflow.source.name',
                      value: 'app.py',
                    },
                    {
                      key: 'mlflow.source.type',
                      value: 'LOCAL',
                    },
                  ],
                },
              },
            },
            {
              name: 'test',
              version: '14',
              creationTimestamp: '1620729271887',
              lastUpdatedTimestamp: '1620729271887',
              deployedBy: [],
              __typename: 'ModelVersion',
              run: {
                info: {
                  runId: '14',
                  experimentId: '1',
                  status: 'FINISHED',
                  startTime: '1620711312827',
                  endTime: '1620711353453',
                  artifactUri:
                    '/project/infuseaicat/phapplications/mlflow-abcd/mlruns/1/14/artifacts',
                  lifecycleStage: 'active',
                },
                data: {
                  metrics: [
                    {
                      key: 'loss',
                      value: 0.09626268595457077,
                      timestamp: '1620711350471',
                      step: '1',
                    },
                    {
                      key: 'accuracy',
                      value: 0.9709333181381226,
                      timestamp: '1620711350471',
                      step: '1',
                    },
                    {
                      key: 'foo',
                      value: 2.844961182938145,
                      timestamp: '1620711353280',
                      step: '0',
                    },
                  ],
                  params: [
                    {
                      key: 'batch_size',
                      value: 'None',
                    },
                    {
                      key: 'class_weight',
                      value: 'None',
                    },
                  ],
                  tags: [
                    {
                      key: 'mlflow.user',
                      value: 'tmp',
                    },
                    {
                      key: 'mlflow.source.name',
                      value:
                        '/opt/conda/lib/python3.7/site-packages/ipykernel_launcher.py',
                    },
                    {
                      key: 'mlflow.source.type',
                      value: 'LOCAL',
                    },
                    {
                      key: 'mlflow.log-model.history',
                      value:
                        '[{"run_id": "5d828746087c4e659c204ed28357776c", "artifact_path": "model", "utc_time_created": "2021-05-11 05:35:50.564024", "flavors": {"keras": {"keras_module": "tensorflow.keras", "keras_version": "2.4.0", "save_format": "tf", "data": "data"}, "python_function": {"loader_module": "mlflow.keras", "python_version": "3.7.10", "data": "data", "env": "conda.yaml"}}}]',
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ];

  const mockGroupContext = {
    id: '123',
    name: 'InfuseAICat',
    displayName: 'InfuseAICat',
    admins: 'cat',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  function TestProvider({ children }) {
    return (
      <MemoryRouter
        initialEntries={[`/g/${MOCK_GROUP_NAME}/models/${MOCK_MODEL_NAME}`]}
      >
        <Route path={`/g/:groupName/models/:modelName`}>
          <GroupContext.Provider value={mockGroupContext}>
            {children}
          </GroupContext.Provider>
        </Route>
      </MemoryRouter>
    );
  }

  return {
    mockRequests,
    TestProvider,
  };
}

describe('ModelDetail', () => {
  it('should render ModelDetail with loading status', () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail />
        </MockedProvider>
      </TestProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render ModelDetail with failure status', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider>
          <ModelDetail />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Can not not load model.')
    ).toBeInTheDocument();
  });

  it('should render ModelDetail with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('Created Time')).toBeInTheDocument();
    expect(await screen.findByText('Last Modified')).toBeInTheDocument();
    expect(await screen.findByText('Version 14')).toBeInTheDocument();
    expect(await screen.findByText('Version 1')).toBeInTheDocument();
  });

  it('should render ModelDetail with setting colums model', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail />
        </MockedProvider>
      </TestProvider>
    );

    expect(screen.queryByText('Select Columns')).not.toBeInTheDocument();

    const columnSettings = await screen.findByTestId('setting-columns');
    userEvent.click(columnSettings);

    expect(await screen.findByText('Select Columns')).toBeInTheDocument();
  });

  it('should render ModelDetail and save all the checked model params', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail />
        </MockedProvider>
      </TestProvider>
    );

    const columnSettings = await screen.findByTestId('setting-columns');
    userEvent.click(columnSettings);

    const paramsCheckBox = await screen.findByTestId('params-checkbox');
    userEvent.click(paramsCheckBox);

    expect(paramsCheckBox).toBeChecked();

    userEvent.click(screen.getByText('OK'));

    expect(window.localStorage.getItem('primehub-model-params')).toBe(
      JSON.stringify(['batch_size', 'class_weight', 'epochs'])
    );

    expect(
      screen.queryByText('batch_size', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('class_weight', {
        selector: '.ant-table-column-title',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('epochs', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
  });

  it('should render ModelDetail and save all the checked model metrics', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail />
        </MockedProvider>
      </TestProvider>
    );

    const columnSettings = await screen.findByTestId('setting-columns');
    userEvent.click(columnSettings);

    const metricsCheckBox = await screen.findByTestId('metrics-checkbox');
    userEvent.click(metricsCheckBox);

    expect(metricsCheckBox).toBeChecked();

    userEvent.click(screen.getByText('OK'));
    expect(window.localStorage.getItem('primehub-model-metrics')).toBe(
      JSON.stringify(['accuracy', 'foo', 'loss'])
    );

    expect(
      screen.queryByText('accuracy', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();

    expect(
      screen.queryByText('foo', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('loss', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
  });

  it('should render ModelDetail and save specify checked model params', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail defaultOpenCollapse />
        </MockedProvider>
      </TestProvider>
    );

    const columnSettings = await screen.findByTestId('setting-columns');
    userEvent.click(columnSettings);

    const batchSizeParameter = await screen.getByDisplayValue('batch_size');
    userEvent.click(batchSizeParameter);

    await waitFor(() => {
      expect(batchSizeParameter).toBeChecked();
    });

    userEvent.click(screen.getByText('OK'));
    expect(window.localStorage.getItem('primehub-model-params')).toBe(
      JSON.stringify(['batch_size'])
    );

    expect(
      screen.queryByText('batch_size', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
  });

  it('should render ModelDetail and save specify checked model metrics', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail defaultOpenCollapse />
        </MockedProvider>
      </TestProvider>
    );

    const columnSettings = await screen.findByTestId('setting-columns');
    userEvent.click(columnSettings);

    const fooMetric = await screen.getByDisplayValue('foo');
    userEvent.click(fooMetric);

    await waitFor(() => {
      expect(fooMetric).toBeChecked();
    });

    userEvent.click(screen.getByText('OK'));
    expect(window.localStorage.getItem('primehub-model-metrics')).toBe(
      JSON.stringify(['foo'])
    );
    expect(
      screen.queryByText('foo', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
  });

  it('should render ModelDetail with default params and metrics', async () => {
    const { TestProvider, mockRequests } = setup();

    // setting default params and metrics
    window.localStorage.setItem(
      'primehub-model-params',
      JSON.stringify(['batch_size'])
    );
    window.localStorage.setItem(
      'primehub-model-metrics',
      JSON.stringify(['foo'])
    );

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ModelDetail defaultOpenCollapse />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('batch_size', {
        selector: '.ant-table-column-title',
      })
    ).toBeInTheDocument();

    expect(
      await screen.findByText('foo', { selector: '.ant-table-column-title' })
    ).toBeInTheDocument();
  });
});
