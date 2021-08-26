import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { Route, MemoryRouter } from 'react-router-dom';
import { List } from '../list';
import { GroupList } from '../GroupList';
import groupsFakeData from '../../../fakeData/groups';

describe('Admin Portal - List Component', () => {
  it('List should render not data in Table', () => {
    const { container, queryByText } = render(<List dataSource={[]} />);
    expect(queryByText('No Data')).toBeInTheDocument();
  });

  it('Render rows properly', () => {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
      },
    ];

    const { container } = render(
      <List dataSource={groupsFakeData} columns={columns} />
    );
    expect(container.querySelectorAll('tr[data-row-key]').length).toBe(
      groupsFakeData.length
    );
  });

  it('Render column properly', () => {
    const columns = [
      {
        title: 'Display Name',
        dataIndex: 'displayName',
        key: 'name',
        sorter: true,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        visible: false,
        key: 'name',
        sorter: true,
      },
    ];

    const { container } = render(
      <List dataSource={groupsFakeData} columns={columns} />
    );
    expect(screen.queryByText('Display Name')).toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  describe('List Component - Render loading', () => {
    it('Should not render loading when didnt provide loading prop', () => {
      const columns = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
        },
      ];

      const { container } = render(
        <List dataSource={groupsFakeData} columns={columns} />
      );
      expect(container.querySelector('.ant-spin')).not.toBeInTheDocument();
    });

    it('Should render loading mask when provide loading prop equal true', () => {
      const columns = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
        },
      ];

      const { container } = render(
        <List dataSource={groupsFakeData} loading={true} columns={columns} />
      );
      expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });
});

describe('Admin Portal - Group List', () => {
  const wrapper = ({ children }) => {
    return (
      <MemoryRouter initialEntries={['/group']}>
        <Route path='/group'>{children}</Route>
      </MemoryRouter>
    );
  };
  beforeEach(() => {
    // @ts-ignore
    global.modelDeploymentOnly = false;
  });

  it('Render Group list with breadcrumb', () => {
    const { container } = render(
      <GroupList dataSource={groupsFakeData} location={{}} />,
      {
        wrapper,
      }
    );
    expect(screen.queryByText('Groups')).toBeInTheDocument();
  });

  it('Should enable delete when disableGroup is falsy or not present', () => {
    const { container } = render(
      <GroupList dataSource={groupsFakeData} location={{}} />,
      {
        wrapper,
      }
    );
    expect(
      container.querySelector('[data-testid="delete-button"]')
    ).not.toHaveAttribute('disabled');
  });

  it('Should disable delete when disableGroup is True', () => {
    // @ts-ignore
    global.disableGroup = true;
    const { container } = render(
      <GroupList dataSource={groupsFakeData} location={{}} />,
      {
        wrapper,
      }
    );
    expect(
      container.querySelector('[data-testid="delete-button"]')
    ).toHaveAttribute('disabled');
  });

  it('Should have have share volume and user quota info', () => {
    const { container } = render(
      <GroupList dataSource={groupsFakeData} location={{}} />,
      {
        wrapper,
      }
    );
    expect(screen.queryByText('Share Volume Capacity')).toBeInTheDocument();
    expect(screen.queryByText('User CPU Quota')).toBeInTheDocument();
    expect(screen.queryByText('User GPU Quota')).toBeInTheDocument();
  });

  it('Should not have share volume and user quota info in PrimeHub Deploy version', () => {
    // @ts-ignore
    global.modelDeploymentOnly = true;
    const { container } = render(
      <GroupList dataSource={groupsFakeData} location={{}} />,
      {
        wrapper,
      }
    );
    expect(screen.queryByText('Share Volume Capacity')).not.toBeInTheDocument();
    expect(screen.queryByText('User CPU Quota')).not.toBeInTheDocument();
    expect(screen.queryByText('User GPU Quota')).not.toBeInTheDocument();
  });
});
