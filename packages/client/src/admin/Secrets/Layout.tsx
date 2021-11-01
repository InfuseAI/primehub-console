import * as React from 'react';
import Breadcrumbs from 'components/share/breadcrumb';

export function SecretLayout({ children }: { children: React.ReactNode }) {
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
              key: 'secret',
              matcher: /\/secret/,
              title: 'Secrets',
              link: '/secret',
              tips: 'Secrets are credentials of authorizations to certain images and volumes. Admin can find and manage secrets here.',
              tipsLink:
                'https://docs.primehub.io/docs/guide_manual/admin-secret',
            },
          ]}
        />
      </div>

      {children}
    </>
  );
}
