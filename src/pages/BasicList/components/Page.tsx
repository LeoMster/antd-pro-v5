import { useEffect } from 'react';
import { Card, Col, Form, Input, message, Row, Space, Spin, Tabs } from 'antd';
import { PageContainer, FooterToolbar } from '@ant-design/pro-layout';
import { useRequest, useLocation, history } from 'umi';
import moment from 'moment';
import FormBuilder from '../builders/FormBuilder';
import ActionBuilder from '../builders/ActionBuilder';
import { setFieldsAdaptor, submitFieldsAdaptor } from '../helper';
import styles from '../index.less';

const Page = () => {
  const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  };
  const [form] = Form.useForm();
  const location = useLocation();
  
  const init = useRequest<{ data: BasicListApi.PageData }>(
    `https://public-api-v2.aspirantzhang.com${location.pathname.replace('/basic-list', '')}?X-API-KEY=antd`, 
    { 
      onError: () => history.goBack(),
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
          ...submitFieldsAdaptor(formValues),
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
        history.goBack();
      },
    },
  );

  useEffect(() => {
    init.data && form.setFieldsValue(setFieldsAdaptor(init.data));
  }, [init.data]);

  const actionHandler = (action: BasicListApi.Action) => {
    switch (action.action) {
      case 'submit':
        form.setFieldsValue({ uri: action.uri, method: action.method });
        form.submit();
        break;
      case 'cancel': 
        history.goBack();
      case 'reset': 
        form.resetFields();
        break;
      default:
        break;
    }
  };
  
  return (
    <PageContainer>
      {init?.loading ? (
        <Spin tip='Loading...' />
      ) : (
        <Form
          form={form}
          {...layout}
          initialValues={{
            create_time: moment(),
            update_time: moment(),
            status: true,
          }}
          onFinish={(values) => request.run(values)}
        >
          <Row gutter={24}>
            <Col sm={16}>
              <Tabs type='card' className={styles.pageTabs}>
                {(init?.data?.layout?.tabs || []).map(tab => {
                  return (
                    <Tabs.TabPane tab={tab.title} key={tab.title}>
                      <Card>{FormBuilder(tab.data)}</Card>
                    </Tabs.TabPane>
                  );
                })}
              </Tabs>
            </Col>
            <Col sm={8} className={styles.textAlignCenter}>
              {(init?.data?.layout?.actions || []).map((action) => {
                return (
                  <Card key={action.title}>
                    <Space>{ActionBuilder(action.data, actionHandler)}</Space>
                  </Card>
                );
              })}
            </Col>
          </Row>
          <FooterToolbar>
            {ActionBuilder(init?.data?.layout?.actions[0].data, actionHandler)}
          </FooterToolbar>
          <Form.Item name='uri' key='uri' hidden>
            <Input />
          </Form.Item>
          <Form.Item name='method' key='method' hidden>
            <Input />
          </Form.Item>
        </Form>
      )}
    </PageContainer>
  );
};

export default Page;

