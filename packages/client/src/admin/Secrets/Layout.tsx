import * as React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, Icon, Tooltip } from 'antd';
import { useRoutePrefix } from 'hooks/useRoutePrefix';

function SecretTooltip() {
  return (
    <Tooltip
      placement="bottom"
      title={
        <div>
          Secrets are credentials of authorizations to certain images and
          datasets. Admin can find and manage secrets here.{' '}
          <a
            href="https://docs.primehub.io/docs/guide_manual/admin-secret"
            target="_blank"
            rel="noopener"
            style={{ color: '#839ce0' }}
          >
            Learn More.
          </a>
        </div>
      }
    >
      <Icon type="question-circle" />
    </Tooltip>
  );
}

export function SecretLayout({ children }: { children: React.ReactNode }) {
  const { appPrefix } = useRoutePrefix();

  return (
    <>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #eee',
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to={`${appPrefix}admin/group`}>
                <Icon type="home" />
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              Secrets <SecretTooltip />
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      {children}
    </>
  );
}
