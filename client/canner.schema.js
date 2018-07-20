/** @jsx builder */
import builder from 'canner-script';

export default (
  <root>
    <object keyName="info" title="info 1">
      <string keyName="firstname" />
      <string keyName="lastname" />
      <string keyName="customInput" packageName="@canner/customize-string-input"/>
    </object>
    <object keyName="info2" title="info 2">
      <string keyName="firstname" />
      <string keyName="lastname" />
      <string keyName="customInput" packageName="@canner/customize-string-input"/>
    </object>
    <object keyName="info3" title="info 3">
      <string keyName="firstname" />
      <string keyName="lastname" />
      <string keyName="customInput" packageName="@canner/customize-string-input"/>
    </object>
    <array keyName="posts"
      ui="tableRoute"
      title="Posts" uiParams={{
      columns: [{
        title: 'title',
        dataIndex: 'title'
      }]
    }}>
      <array keyName="notes" title="notes">
        <object>
          <string keyName="note" />
          <array keyName="images" ui="gallery">
            <image />
          </array>
        </object>
      </array>
      <string keyName="title" title="Title" />
      <string keyName="content" title="Content" />
    </array>
  </root>
)
