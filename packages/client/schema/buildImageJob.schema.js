/** @jsx builder */
import builder, {Condition, Layout, Block, Row, Col, Default} from 'canner-script';
import {Tag} from 'antd';
import {ImagePackages} from './utils.schema';
import BuilImageJobRefetchHelper from '../src/cms-layouts/buildImageJobRefetchHelper';

export default () => (
  <array keyName="buildImageJob"
    title="${buildImageJob}"
    cannerDataType="array"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    hideBackButton={true}
    hideButtons={true}
    refetch
  >
    <Default component={BuilImageJobRefetchHelper}>
      <Condition match={(data, operator) => false} defaultMode="disabled">
        <string keyName="imageRevision" title="${buildImageJob.imageRevision}" />
        <string keyName="baseImage" title="${buildImageJob.baseImage}" />
        <dateTime
          keyName="updateTime"
          title="${buildImageJob.updateTime}"
          packageName="../src/cms-components/customize-string-date.tsx"
          hidden
        />
        <string keyName="status" title="${buildImageJob.status}"/>
        <ImagePackages
          apt={{
            rows: 5,
            cols: 30,
            disabled: true,
            placeholderTemplate: 'buildImage.packages.apt.placeholder',
            minlength: 10,
            maxlength: 20
          }}
          pip={{
            rows: 5,
            cols: 30,
            disabled: true,
            placeholderTemplate: 'buildImage.packages.pip.placeholder',
            minlength: 10,
            maxlength: 20
          }}
          conda={{
            rows: 5,
            cols: 30,
            disabled: true,
            placeholderTemplate: 'buildImage.packages.conda.placeholder',
            minlength: 10,
            maxlength: 20
          }}
        />
        <string
          keyName="logEndpoint"
          title="${buildImageJob.logEndpoint}"
          packageName="../src/cms-components/customize-string-log"
          uiParams={{
            rows: 30
          }}
        /> 
      </Condition>
    </Default>
  </array>
)
