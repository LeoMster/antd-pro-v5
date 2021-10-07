import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Modal as AntdModal,
  message,
  Pagination,
  Row,
  Space,
  Table,
  Tooltip,
} from 'antd';
import { ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer, FooterToolbar } from '@ant-design/pro-layout';
import QueueAnim from 'rc-queue-anim';
import { useRequest, useIntl, history } from 'umi';
import { useSessionStorageState, useToggle } from 'ahooks';
import { stringify } from 'query-string';
import ColumnBuilder from './builders/ColumnBuilder';
import ActionBuilder from './builders/ActionBuilder';
import SearchBuilder from './builders/SearchBuilder';
import Modal from './components/Modal'
import { submitFieldsAdaptor } from './helper'
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
  const [searchVisible, searchAction] = useToggle(false);
  const lang = useIntl();
  const [searchForm] = Form.useForm();

  const init = useRequest<{ data: BasicListApi.ListData }>(
    (values: any) => {
      return {
        url: `https://public-api-v2.aspirantzhang.com/api/admins?X-API-KEY=antd${pageQuery}`,
        params: values,
        paramsSerializer: (params: any) => {
          return stringify(params, {
            arrayFormat: 'comma',
            skipEmptyString: true,
            skipNull: true,
          });
        },
      };
    }
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
      case 'page': {
        const uri = (action.uri || '').replace(/:\w+/g, (field) => {
          return record[field.replace(':', '')];
        });
        history.push(`/basic-list${uri}`);
        break;
      }
      case 'reload':
        init.run();
        break;
      case 'delete':
      case 'deletePermanently':
      case 'restore': {
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
      }
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

  const onFinish = (value: any) => {
    init.run(submitFieldsAdaptor(value));
  }
  
  const searchLayout = () => {
    return searchVisible && (
      <QueueAnim type='top'>
        <div key='searchForm'>
          <Card className={styles.searchForm} key='searchForm'>
            <Form form={searchForm} onFinish={onFinish}>
              <Row gutter={24}>
                <Col sm={6}>
                  <Form.Item label='ID' name='id' key='id'>
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                {SearchBuilder(init.data?.layout.tableColumn)}
              </Row>
              <Row>
                <Col sm={24} className={styles.textAlignRight}>
                  <Space>
                    <Button type='primary' htmlType='submit'>
                      Submit
                    </Button>
                    <Button
                      onClick={() => {
                        init.run();
                        searchForm.resetFields();
                      }}
                    >
                      Clear
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>
        </div>
      </QueueAnim>
    );
  };

  const beforeTableLayout = () => {
    return (
      <Row>
        <Col xs={24} sm={12}>
          ...
        </Col>
        <Col xs={24} sm={12} className={styles.tableToolBar}>
          <Space>
            <Tooltip title='search'>
              <Button
                shape='circle'
                icon={<SearchOutlined />}
                onClick={() => searchAction.toggle()}
                type={searchVisible ? 'primary' : 'default'}
              />
            </Tooltip>
            {ActionBuilder(
              init?.data?.layout?.tableToolBar,
              actionHandler,
              false
            )}
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
