import * as React from 'react';
import Breadcrumbs from 'components/share/breadcrumb';

export function VolumeLayout({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const tipsLink =
    page === 'create'
      ? 'https://docs.primehub.io/docs/guide_manual/admin-volume#creating-new-volume'
      : 'https://docs.primehub.io/docs/guide_manual/admin-volume';

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
              key: 'volume',
              matcher: /\/volume/,
              title: 'Volumes',
              link: '/volume',
              tips: 'Admin can manage volumes and control the access to them.',
              tipsLink,
            },
          ]}
        />
      </div>

      {children}
    </>
  );
}
