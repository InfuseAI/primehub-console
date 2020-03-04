import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import ScheduleDetail from 'components/schedule/detail';
import {errorHandler} from 'components/job/errorHandler';
import {RUN_SCHEDULE, PhScheduleFragment} from 'containers/scheduleList';
import {get} from 'lodash';

type Props = {
  getPhSchedule: any;
  runPhSchedule: Function;
  runPhScheduleResult: any;
} & RouteComponentProps<{
  scheduleId: string;
}>;

export const GET_PH_SCHEDULE = gql`
  query phSchedule($where: PhScheduleWhereUniqueInput!) {
    phSchedule(where: $where) {
      ...PhScheduleInfo
    }
  }
  ${PhScheduleFragment}
`;

const appPrefix = (window as any).APP_PREFIX || '/';

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class ScheduleDetailContainer extends React.Component<Props> {
  render() {
    const {getPhSchedule, history, runPhSchedule, runPhScheduleResult} = this.props;
    if (getPhSchedule.loading) return null;
    if (getPhSchedule.error) {
      return getMessage(getPhSchedule.error)
    };
    return (
      <ScheduleDetail
        runPhSchedule={runPhSchedule}
        runPhScheduleResult={runPhScheduleResult}
        schedule={getPhSchedule.phSchedule || {id: 'test'}}
        appPrefix={appPrefix}
        history={history}
      />
    );
  }
}

export default compose(
  graphql(GET_PH_SCHEDULE, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.scheduleId
        }
      },
      fetchPolicy: 'cache-and-network'
    }),
    name: 'getPhSchedule'
  }),
  graphql(RUN_SCHEDULE, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_SCHEDULE,
        variables: {where: {id: props.match.params.scheduleId}}
      }],
      onCompleted: () => {
        props.history.goBack();
      },
      onError: errorHandler
    }),
    name: 'runPhSchedule'
  })
)(ScheduleDetailContainer)
