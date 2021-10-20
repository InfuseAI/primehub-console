import * as React from 'react';
import Breadcrumbs from 'components/share/breadcrumb';

export function ImagesLayout({ children }: { children: React.ReactNode }) {
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
              key: 'image',
              matcher: /\/image/,
              title: 'Images',
              link: '/image',
              tips: 'Images are working environments of instances. Admin can find and manage images.',
              tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-image',
            },
          ]}
        />
      </div>

      {children}
    </>
  );
}
