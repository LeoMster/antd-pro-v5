import { useState, useEffect } from 'react';
import {
  Card,
  Col,
  Modal as AntdModal,
  message,
  Pagination,
  Row,
  Space,
  Table,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { PageContainer, FooterToolbar } from '@ant-design/pro-layout';
import { useRequest, useIntl } from 'umi';
import { useSessionStorageState } from 'ahooks';
import ColumnBuilder from './builders/ColumnBuilder';
import ActionBuilder from './builders/ActionBuilder';
import Modal from './components/Modal'
import styles from './index.less';

const BasicList = () => {
  const [pageQuery, setPageQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalUri, setModalUri] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tableColumns, setTableColumns] = useSessionStorageState<BasicListApi.Field[]>(
    'basicListTableColumns', 
    [],
  );
  const lang = useIntl();

  const init = useRequest<{ data: BasicListApi.ListData }>(
    `https://public-api-v2.aspirantzhang.com/api/admins?X-API-KEY=antd${pageQuery}`
  );
  const request = useRequest(
    (values: any) => {
      message.loading({
        content: 'Processing...',
        key: 'process',
        duration: 0,
      })
      const { uri, method, ...formValues } = values;
      return {
        url: `https://public-api-v2.aspirantzhang.com${uri}`,
        method,
        data: {
          ...formValues,
          'X-API-KEY': 'antd',
        },
      };
    }, 
    {
      manual: true,
      formatResult: (res: any) => res,
      onSuccess: (data) => {
        message.success({
          content: data?.message,
          key: 'process',
        });
      },
    },
  );

  useEffect(() => {
    init.run();
  }, [pageQuery]);

  useEffect(() => {
    init?.data?.layout?.tableColumn && 
      setTableColumns(ColumnBuilder(init.data.layout.tableColumn, actionHandler));
  }, [init?.data?.layout?.tableColumn]);

  useEffect(() => {
    modalUri && setModalVisible(true);
  }, [modalUri]);

  const actionHandler = (action: BasicListApi.Action, record: BasicListApi.Field) => {
    switch (action.action) {
      case 'modal':
        setModalUri(
          (action.uri || '').replace(/:\w+/g, (field) => {
            return record[field.replace(':', '')];
          })
        );
        break;
      case 'reload':
        init.run();
        break;
      case 'delete':
      case 'deletePermanently':
      case 'restore':
        const operationName = lang.formatMessage({
          id: `basic-list.list.actionHandler.operation.${action.action}`
        });
        AntdModal.confirm({
          title: lang.formatMessage({
            id: 'basic-list.list.actionHandler.confirmTitle',
          }, {
            operationName: operationName,
          }),
          icon: <ExclamationCircleOutlined />,
          content: batchOverview(Object.keys(record).length ? [record] : selectedRows),
          okText: action.action,
          okType: 'danger',
          cancelText: 'Cancel',
          onOk() {
            return request.run({
              uri: action.uri,
              method: action.method,
              type: action.action,
              ids: Object.keys(record).length ? [record.id] : selectedRowKeys,
            });
          },
        });
        break;
      default:
        break;
    }
  };

  const batchOverview = (dataSource: BasicListApi.Field[]) => {
    return (
      <Table
        size='small'
        rowKey='id'
        columns={[tableColumns[0] || {}, tableColumns[1] || {}]}
        dataSource={dataSource}
        pagination={false}
      />
    );
  };

  const paginationChangeHandler = (page: number, per_page: any) => {
    setPageQuery(`&page=${page}&per_page=${per_page}`);
  };

  const hideModal = (reload = false) => {
    setModalVisible(false);
    setModalUri('');
    reload && init.run();
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (_selectRowKeys: any, _selectRows: any) => {
      setSelectedRowKeys(_selectRowKeys);
      setSelectedRows(_selectRows);
    },
  };
  
  const searchLayout = () => {};

  const beforeTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolBar}>
          <Space>
            {ActionBuilder(init?.data?.layout?.tableToolBar, actionHandler, false)}
          </Space>
        </Col>
      </Row>
    );
  };

  const afterTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolBar}>
          <Pagination
            total={init?.data?.meta?.total || 0}
            current={init?.data?.meta?.page || 1}
            pageSize={init?.data?.meta?.per_page || 10}
            showSizeChanger
            showQuickJumper
            showTotal={total => `Total ${total} items`}
            onChange={paginationChangeHandler}
            onShowSizeChange={paginationChangeHandler}
          />
        </Col>
      </Row>
    );
  };

  const batchToolbar = () => {
    return selectedRowKeys.length > 0 && (
      <Space>
        {ActionBuilder(init?.data?.layout?.batchToolBar, actionHandler)}
      </Space>
    );
  };
  
  return (
    <PageContainer>
      {searchLayout()}
      <Card>
        {beforeTableLayout()}
        <Table
          rowKey='id'
          loading={init?.loading}
          dataSource={init?.data?.dataSource}
          columns={tableColumns}
          pagination={false}
          rowSelection={rowSelection}
        />
        {afterTableLayout()}
      </Card>
      <Modal 
        modalVisible={modalVisible} 
        hideModal={hideModal}
        modalUri={modalUri}
      />
      <FooterToolbar extra={batchToolbar()} />
    </PageContainer>
  );
};

export default BasicList;
