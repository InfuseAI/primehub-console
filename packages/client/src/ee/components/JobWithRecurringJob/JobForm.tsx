import React, {
  ReactNode,
  FormEvent,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import get from 'lodash/get';
import gql from 'graphql-tag';
import unionBy from 'lodash/unionBy';
import omit from 'lodash/omit';
import {
  Alert,
  Button,
  Col,
  Card,
  Divider,
  Form,
  Input,
  Icon,
  Radio,
  Row,
  Tooltip,
} from 'antd';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { useHistory } from 'react-router-dom';
import type { FormComponentProps } from 'antd/lib/form';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import NumberWithSelectMultipler from 'cms-components/customize-number-with_select_multiplier';
import { GroupContext, withGroupContext } from 'context/group';
import { CurrentUser } from 'queries/User.graphql';
import { errorHandler } from 'utils/errorHandler';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { sortNameByAlphaBet } from 'utils/sorting';
import type { TInstanceType } from 'admin/InstanceTypes';
import type { Image } from 'admin/Images';

import { RecurrenceInput, recurrenceValidator } from './RecurrenceInput';
import {
  transformImages,
  getImageType,
  dashOrNumber,
  stringifyZone,
} from './utils';
import type {
  CreateJobVariables,
  CreateScheduleVariables,
  RecurrenceType,
} from './types';

const defaultBreadcrumbs = [
  {
    key: 'list',
    matcher: /\/job/,
    title: 'Jobs',
    link: '/job?page=1',
  },
  {
    key: 'create',
    matcher: /\/job\/create/,
    title: 'New Job',
    tips: 'Create a new job.',
    tipsLink: 'https://docs.primehub.io/docs/job-submission-feature#create-job',
  },
];

const radioStyle = {
  display: 'block',
  padding: '4px 8px',
  margin: 0,
  border: '1px solid #e8e8e8',
};

const radioGroupStyle = {
  width: '100%',
  maxHeight: '30vh',
  overflow: 'auto',
  border: '1px solid #e8e8e8',
};

const radioContentStyle = {
  display: 'inline-block',
  verticalAlign: 'top',
};

const withDisabledStyle = {
  color: 'rgba(0, 0, 0, 0.25)',
};

const commandPlaceHolder = `echo "Start training"
python /project/group-a/train.py \\
  --dataset /datasets/dataset-a/train.txt \\
  --output /workingdir/output \\
  --parameter_1 value_1 \\
  --parameter_2 value_2
`;

type FormState = {
  id?: string;
  groupId: string;
  instanceTypeId: string;
  instanceType: string;
  instanceTypeName: string;
  image: string;
  displayName: string;
  command: string;
  activeDeadlineSeconds: number;
  executeOptions: 'job' | 'jobAndSchedule' | 'schedule';
  recurrence: {
    cron: string;
    type: RecurrenceType;
    __typename?: string;
  };
};

type JobFormProps = FormComponentProps<FormState> & {
  currentUser: {
    loading: boolean;
    error: Error | undefined;
    me: {
      id: string;
      username: string;
      isAdmin: boolean;
      isCurrentGroupAdmin: boolean;
      groups: Array<{ id: string; name: string }>;
    };
    refetch: () => Promise<void>;
  };
  systemInfo: {
    loading: boolean;
    error: Error | undefined;
    system: {
      timezone: {
        name: string;
        offset: number;
      };
    };
  };
  createPhJob: ({
    variables: { data },
  }: {
    variables: { data: CreateJobVariables };
  }) => Promise<{ id: string }>;
  createPhSchedule: ({
    variables: { data },
  }: {
    variables: { data: CreateScheduleVariables };
  }) => Promise<{ id: string }>;

  breadcrumbs?: ReactNode;

  /*
   * Re-use this form for editing schedule detail.
   */
  editSchedule?: boolean;

  /*
   * Given schedule detail information.
   */
  data?: FormState;

  onUpdateRecurringJob?: ({
    id,
    data,
  }: {
    id: string;
    data: Record<string, unknown>;
  }) => void;
};

type State = {
  groups: Array<{ id: string; name: string; displayName: string }>;
  instanceTypes: Array<
    Omit<
      TInstanceType,
      'nodeSelector' | 'tolerations' | 'cpuRequest' | 'memoryRequest'
    >
  >;
  everyoneGroup: Array<Record<string, unknown>> | null;
  images: Array<Omit<Image, 'logEndpoint' | 'imageSpec' | 'jobStatus'>>;
  activeDeadlineSeconds: number;
  radioValues: Record<'instanceType' | 'image', string>;
  isEditingRecurringJob?: boolean;
};

type Actions =
  | { type: 'GROUPS'; value: State['groups'] }
  | { type: 'INSTANCE_TYPES'; value: State['instanceTypes'] }
  | { type: 'EVERYONE_GROUP'; value: State['everyoneGroup'] }
  | { type: 'IMAGES'; value: State['images'] }
  | { type: 'ACTIVE_DEADLINE_SECONDS'; value: State['activeDeadlineSeconds'] }
  | { type: 'RADIO_VALUES'; value: State['radioValues'] }
  | { type: 'IS_EDITING_RECURRING_JOB'; value: State['isEditingRecurringJob'] };

function reducer(state: State, action: Actions) {
  switch (action.type) {
    case 'GROUPS':
      return {
        ...state,
        groups: action.value,
      };
    case 'INSTANCE_TYPES':
      return {
        ...state,
        instanceTypes: action.value,
      };
    case 'EVERYONE_GROUP':
      return {
        ...state,
        everyoneGroup: action.value,
      };

    case 'IMAGES':
      return {
        ...state,
        images: action.value,
      };

    case 'ACTIVE_DEADLINE_SECONDS':
      return {
        ...state,
        activeDeadlineSeconds: action.value,
      };

    case 'RADIO_VALUES':
      return {
        ...state,
        radioValues: action.value,
      };

    case 'IS_EDITING_RECURRING_JOB':
      return {
        ...state,
        isEditingRecurringJob: action.value,
      };
  }
}

const initialState: Partial<FormState> = {
  groupId: '',
  instanceTypeId: '',
  instanceType: '',
  instanceTypeName: '',
  image: '',
  displayName: '',
  command: '',
  executeOptions: 'job',
  recurrence: {
    cron: '',
    type: 'inactive',
  },
};

function JobForm({ currentUser, systemInfo, form, ...props }: JobFormProps) {
  const groupContext = useContext(GroupContext);
  const [state, dispatch] = useReducer(reducer, {
    groups: [],
    everyoneGroup: null,
    instanceTypes: [],
    images: [],
    activeDeadlineSeconds: 86400,
    radioValues: {
      instanceType: '',
      image: '',
    },
    isEditingRecurringJob: false,
  });

  const { appPrefix } = useRoutePrefix();
  const history = useHistory();
  const params = new URLSearchParams(history.location.search);
  const routePrefix = `${appPrefix}g/${groupContext.name}`;

  const fromURLParams = JSON.parse(params.get('defaultValue'));

  // Creating form initial state: If `props.data` has value means is editing a recurring job,
  // otherwise, checking URL parameters has values if clone from another job.
  const formState = props?.data || fromURLParams || initialState;

  useEffect(() => {
    if (typeof window === undefined) return;

    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []);
    const groups = allGroups
      .filter(group => group.id !== everyoneGroupId)
      .filter(group => !groupContext || groupContext.id === group.id);

    const everyoneGroup = allGroups.find(group => group.id === everyoneGroupId);
    const group = groups.find(group => group.id === groupContext.id);
    const getJobDeadlineSeconds =
      get(group, 'jobDefaultActiveDeadlineSeconds', null) ||
      window.jobDefaultActiveDeadlineSeconds;

    const sortedInstanceTypes = sortNameByAlphaBet(
      unionBy(
        get(group, 'instanceTypes', []),
        get(everyoneGroup, 'instanceTypes', []),
        'id'
      )
    );
    const sortedImages = sortNameByAlphaBet(
      unionBy(get(group, 'images', []), get(everyoneGroup, 'images', []), 'id')
    );

    dispatch({ type: 'GROUPS', value: groups });
    dispatch({ type: 'EVERYONE_GROUP', value: everyoneGroup });
    dispatch({ type: 'INSTANCE_TYPES', value: sortedInstanceTypes });
    dispatch({ type: 'IMAGES', value: sortedImages });
    dispatch({
      type: 'ACTIVE_DEADLINE_SECONDS',
      value: Number(getJobDeadlineSeconds),
    });
    dispatch({
      type: 'RADIO_VALUES',
      value: {
        instanceType: sortedInstanceTypes[0].id,
        image: sortedImages[0].id,
      },
    });
  }, [currentUser, groupContext]);

  useEffect(() => {
    // Props have `data` property represent is editing recurring job
    if (props.data) {
      dispatch({ type: 'IS_EDITING_RECURRING_JOB', value: true });
    }
  }, [props.data]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    form.validateFields(
      async (err, { executeOptions, ...values }: FormState) => {
        if (err) {
          return;
        }

        try {
          if (state.isEditingRecurringJob) {
            await props.onUpdateRecurringJob({
              id: props.data.id,
              data: omit(values, 'recurrence.__typename'),
            });
          } else {
            if (executeOptions === 'job') {
              await props.createPhJob({
                variables: {
                  data: values as CreateJobVariables,
                },
              });

              history.push(`${routePrefix}/job`);
            }

            if (executeOptions === 'jobAndSchedule') {
              // create and run jub & schedule
              await props.createPhJob({
                variables: {
                  data: omit(values, 'recurrence') as CreateJobVariables,
                },
              });
              await props.createPhSchedule({
                variables: {
                  data: values as CreateScheduleVariables,
                },
              });

              history.push(`${routePrefix}/job`);
            }

            if (executeOptions === 'schedule') {
              // create and run schedule
              await props.createPhSchedule({
                variables: {
                  data: values as CreateScheduleVariables,
                },
              });

              history.push(`${routePrefix}/recurringJob`);
            }
          }
        } catch (err) {
          console.error(err);
          errorHandler(err);
        }
      }
    );
  }

  return (
    <>
      {props?.breadcrumbs ?? (
        <PageTitle breadcrumb={<Breadcrumbs pathList={defaultBreadcrumbs} />} />
      )}

      <Form onSubmit={onSubmit} style={{ margin: '16px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={16} lg={16}>
            <Card>
              <h4>Environment Settings</h4>

              <Divider />

              {currentUser?.me.groups.length === 0 ? (
                <Alert
                  showIcon
                  message='No group is configured for you to launch a server. Please contact admin.'
                  type='warning'
                />
              ) : (
                <>
                  {form.getFieldDecorator('groupId', {
                    initialValue: formState.groupId || groupContext.id,
                  })(<Input type='hidden' />)}

                  <Form.Item
                    label={
                      <Label
                        defaultLabel='Instance Types'
                        invalid={
                          formState.instanceTypeId &&
                          !form.getFieldValue('instanceType') &&
                          !state.instanceTypes.find(
                            it => it.id === formState.instanceTypeId
                          )
                        }
                        message={
                          <span>
                            The instance type{' '}
                            <b>{formState.instanceTypeName}</b> was deleted.
                          </span>
                        }
                      />
                    }
                  >
                    {form.getFieldDecorator('instanceType', {
                      initialValue:
                        formState.instanceTypeId ||
                        state.radioValues.instanceType,
                      rules: [
                        {
                          required: true,
                          message: 'Please select a instance type!',
                        },
                      ],
                    })(
                      state.instanceTypes.length > 0 ? (
                        <Radio.Group
                          style={radioGroupStyle}
                          onChange={event =>
                            dispatch({
                              type: 'RADIO_VALUES',
                              value: {
                                ...state.radioValues,
                                instanceType: event.target.value,
                              },
                            })
                          }
                        >
                          {state.instanceTypes.map(instanceType => (
                            <Radio
                              key={instanceType.id}
                              value={instanceType.id}
                              style={radioStyle}
                            >
                              <div style={radioContentStyle}>
                                <h4>
                                  {instanceType.displayName ||
                                    instanceType.name}
                                  <Tooltip
                                    title={`CPU: ${dashOrNumber(
                                      String(instanceType.cpuLimit)
                                    )} / Memory: ${dashOrNumber(
                                      String(instanceType.memoryLimit)
                                    )} G / GPU: ${dashOrNumber(
                                      String(instanceType.gpuLimit)
                                    )}`}
                                  >
                                    <Icon
                                      type='info-circle'
                                      theme='filled'
                                      style={{ marginLeft: 8 }}
                                    />
                                  </Tooltip>
                                </h4>
                                {instanceType.description}
                              </div>
                            </Radio>
                          ))}
                        </Radio.Group>
                      ) : (
                        <Card>No instance in this group.</Card>
                      )
                    )}
                  </Form.Item>

                  <Form.Item
                    label={
                      <Label
                        defaultLabel='Images'
                        invalid={
                          formState.image &&
                          !form.getFieldValue('image') &&
                          !state.images.find(it => it.id === formState.image)
                        }
                        message={
                          <span>
                            The image <b>{formState.image}</b> was deleted.
                          </span>
                        }
                      />
                    }
                  >
                    {form.getFieldDecorator('image', {
                      initialValue: formState.image || state.radioValues.image,
                      rules: [
                        { required: true, message: 'Please select a image!' },
                      ],
                    })(
                      state.images.length > 0 ? (
                        <Radio.Group
                          style={radioGroupStyle}
                          onChange={event =>
                            dispatch({
                              type: 'RADIO_VALUES',
                              value: {
                                ...state.radioValues,
                                image: event.target.value,
                              },
                            })
                          }
                        >
                          {transformImages(
                            state.images,
                            state.instanceTypes.find(
                              instanceType =>
                                instanceType.id ===
                                form.getFieldValue('instanceType')
                            )
                          ).map(image => {
                            const isGroupImage =
                              (image?.spec?.groupName as string)?.length > 0
                                ? true
                                : false;

                            const label =
                              (image.isReady ? '' : '(Not Ready) ') +
                              (isGroupImage ? 'Group' : 'System') +
                              ' / ' +
                              getImageType(image);

                            const h4Style = image.__disabled
                              ? withDisabledStyle
                              : {};

                            return (
                              <Radio
                                key={image.id}
                                value={image.id}
                                disabled={image.__disabled}
                                style={radioStyle}
                              >
                                <div style={radioContentStyle}>
                                  <h4 style={h4Style}>
                                    {image.displayName || image.name}
                                    <Tooltip title={`${label}`}>
                                      <Icon
                                        type='info-circle'
                                        theme='filled'
                                        style={{ marginLeft: 8 }}
                                      />
                                    </Tooltip>
                                  </h4>
                                  {image.description}
                                </div>
                              </Radio>
                            );
                          })}
                        </Radio.Group>
                      ) : (
                        <Card>No image in this group.</Card>
                      )
                    )}
                  </Form.Item>
                </>
              )}
            </Card>

            <Card style={{ marginTop: '16px' }}>
              <h4>Job Details</h4>

              <Divider />

              <Form.Item label='Name'>
                {form.getFieldDecorator('displayName', {
                  initialValue: formState.displayName,
                  rules: [
                    {
                      whitespace: true,
                      required: true,
                      message: 'Please input a name!',
                    },
                  ],
                })(<Input />)}
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Command{' '}
                    <Tooltip
                      title={
                        <>
                          <h4 style={{ color: 'white' }}>Information</h4>
                          <div>{`Commands allow multiline. The working directory is located at '/home/jovyan'. The group volume is mounted at '/home/jovyan/<group>' and datasets are mounted at '/home/jovyan/datasets/<dataset>'.`}</div>
                        </>
                      }
                    >
                      <Icon type='question-circle-o' />
                    </Tooltip>
                  </span>
                }
              >
                {form.getFieldDecorator('command', {
                  initialValue: formState.command,
                  rules: [
                    { required: true, message: 'Please input commands!' },
                  ],
                })(
                  <Input.TextArea placeholder={commandPlaceHolder} rows={10} />
                )}
              </Form.Item>

              <Form.Item label='Default Timeout'>
                {form.getFieldDecorator('activeDeadlineSeconds', {
                  initialValue:
                    formState.activeDeadlineSeconds ??
                    state.activeDeadlineSeconds,
                })(
                  <NumberWithSelectMultipler
                    uiParams={{
                      options: [
                        {
                          text: 'Minutes',
                          value: 'm',
                          multiplier: 60,
                        },
                        {
                          text: 'Hours',
                          value: 'h',
                          multiplier: 60 * 60,
                        },
                        {
                          text: 'Days',
                          value: 'd',
                          multiplier: 60 * 60 * 24,
                        },
                      ],
                      styleOnSelect: { width: 200 },
                      defaultSelected: 1,
                      styleOnInput: { width: 100, marginRight: 10 },
                      min: 0,
                      max: 999,
                      step: 1,
                    }}
                  />
                )}
              </Form.Item>

              <Form.Item
                label='Execute this Job'
                style={{
                  display: state.isEditingRecurringJob ? 'none' : 'block',
                }}
              >
                {form.getFieldDecorator('executeOptions', {
                  // Due to adding a new field so add fallback value here.
                  initialValue: formState.executeOptions || 'job',
                  rules: [{ required: true }],
                })(
                  <Radio.Group>
                    <Radio value='job'>Immediately</Radio>
                    <Radio value='jobAndSchedule'>
                      Immediately & Recurring
                    </Radio>
                    <Radio value='schedule'>Recurring</Radio>
                  </Radio.Group>
                )}
              </Form.Item>

              {(form.getFieldValue('executeOptions') === 'jobAndSchedule' ||
                form.getFieldValue('executeOptions') === 'schedule' ||
                state.isEditingRecurringJob) && (
                <Form.Item
                  label={
                    <>
                      Recurrence Options (
                      {stringifyZone(systemInfo.system.timezone)})
                    </>
                  }
                >
                  {form.getFieldDecorator('recurrence', {
                    // Due to adding a new field so add fallback value here.
                    initialValue: formState.recurrence || {
                      cron: '',
                      type: 'inactive',
                    },
                    rules: [{ validator: recurrenceValidator }],
                    // @ts-ignore component will receive props from decorator
                  })(<RecurrenceInput />)}
                </Form.Item>
              )}
            </Card>

            <Button
              type='primary'
              htmlType='submit'
              style={{ width: '100%', marginTop: '16px' }}
            >
              Submit
            </Button>
          </Col>

          <Col xs={24} sm={8} lg={8}>
            <ResourceMonitor
              showDataset
              refetchGroup={currentUser?.refetch}
              selectedGroup={groupContext.id}
              globalDatasets={get(state.everyoneGroup, 'datasets', [])}
            />
          </Col>
        </Row>
      </Form>
    </>
  );
}

export default compose(
  withGroupContext,
  graphql(CurrentUser, {
    name: 'currentUser',
    options: () => ({
      onError: errorHandler,
    }),
  }),
  graphql(
    gql`
      query {
        system {
          timezone {
            name
            offset
          }
        }
      }
    `,
    {
      name: 'systemInfo',
      options: () => ({
        onError: errorHandler,
      }),
    }
  ),
  graphql(
    gql`
      mutation createPhJob($data: PhJobCreateInput!) {
        createPhJob(data: $data) {
          id
        }
      }
    `,
    { name: 'createPhJob' }
  ),
  graphql(
    gql`
      mutation createPhSchedule($data: PhScheduleCreateInput!) {
        createPhSchedule(data: $data) {
          id
        }
      }
    `,
    { name: 'createPhSchedule' }
  )
)(Form.create<JobFormProps>()(JobForm));

function Label(props: {
  defaultLabel: string;
  invalid: boolean;
  message: React.ReactNode | string;
}) {
  if (props.invalid) {
    return (
      <span>
        {props.defaultLabel}{' '}
        <span style={{ color: 'red' }}>({props.message})</span>
      </span>
    );
  }

  return <span>{props.defaultLabel}</span>;
}
