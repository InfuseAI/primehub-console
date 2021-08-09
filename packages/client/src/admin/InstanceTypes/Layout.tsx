import * as React from 'react';
import Breadcrumbs from 'components/share/breadcrumb';

export function InstanceTypesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
              key: 'instanceType',
              matcher: /\/instanceType/,
              title: 'Instance Types',
              link: 'admin/instanceType',
              tips: 'Instance type is a preset of resource allocation. Admin can find and manage instance types here.',
              tipsLink:
                'https://docs.primehub.io/docs/guide_manual/admin-instancetype',
            },
          ]}
        />
      </div>

      {children}
    </>
  );
}
