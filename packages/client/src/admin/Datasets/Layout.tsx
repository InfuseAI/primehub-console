import * as React from 'react';
import Breadcrumbs from 'components/share/breadcrumb';

export function DatasetLayout({ page, children }: { page: string, children: React.ReactNode }) {
  const tipsLink =
    page === 'create' ?
    'https://docs.primehub.io/docs/guide_manual/admin-dataset#creating-new-dataset':
    'https://docs.primehub.io/docs/guide_manual/admin-dataset';

  return (<>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #eee',
          padding: '16px 24px',
        }}
      >
        <Breadcrumbs
          pathList={[
            {
              key: 'dataset',
              matcher: /\/dataset/,
              title: 'Datasets',
              link: 'admin/dataset',
              tips: 'Admin can manage datasets and control the access to them.',
              tipsLink,
            },
          ]}
        />
      </div>

      {children}
      </>
  );

}
