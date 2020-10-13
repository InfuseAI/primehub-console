/** @jsx CannerScript */
import CannerScript, {Condition, Default} from 'canner-script';
import {renderTextWithTooltip} from 'schema/utils';
import moment from 'moment';
import Filter from '../../src/cms-toolbar/filter';

const renderDate = (text, record) => {
  if(moment(text).isValid()) {
    if(moment(new Date().toISOString()).format('YYYY/M')==record.id) {
      return renderTextWithTooltip(moment(text).format('MMMM YYYY'), 'This report only includes usage up until today, as this month is not over yet.');
    } else {
      return moment(text).format('MMMM YYYY');
    }
  } else {
    return text;
  }
}

export default () => (
  <array ui="tableRoute"
    keyName="usageReport"
    title="Usage Reports"
    packageName="../../src/cms-components/customize-array-table_route"
    hideBackButton={true}
    controlDeployAndResetButtons={true}
    cacheActions={true}
    uiParams={{
      columns: [{
        title: '${usageReport.table.id}',
        dataIndex: 'id',
        sorter: (a, b) => (b.id || '').localeCompare(a.id || ''),
        render: (text, record) => renderDate(text, record),
      }],
      removeActions: true,
      usageReportCustomActions: true,
      disableCreate: true,
    }}
    graphql={`
    query($usageReportPage: Int, $usageReportOrderBy: UsageReportOrderByInput, $usageReportWhere: UsageReportWhereInput) {
      usageReport: usageReportsConnection (page: $usageReportPage, orderBy: $usageReportOrderBy, where: $usageReportWhere) {
        edges {
          cursor
          node {
            id
            summaryUrl
            detailedUrl
          }
        }
        pageInfo {
          currentPage
          totalPage
        }
      }
    }
    `}
    fetchPolicy="network-only"
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${usageReport.table.id}',
          key: 'id',
          placeholder: 'YYYY/M'
        }]}
      />
      <pagination number />
    </toolbar>
  </array>
)
