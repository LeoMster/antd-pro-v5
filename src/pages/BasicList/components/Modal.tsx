import { useEffect } from 'react';
import { Form, Input, Modal as AntdModal, message } from 'antd';
import { useRequest } from 'umi';
import moment from 'moment';
import FormBuilder from '../builders/FormBuilder';
import ActionBuilder from '../builders/ActionBuilder';
import { setFieldsAdaptor, submitFieldsAdaptor } from '../helper'

const Modal = ({
  modalVisible,
  hideModal,
  modalUri,
}: {
  modalVisible: boolean;
  hideModal: (reload?: boolean) => void;
  modalUri: string;
}) => {
  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 16 },
  };
  const [form] = Form.useForm();
  
  const init = useRequest<{ data: BasicListApi.PageData }>(
    `https://public-api-v2.aspirantzhang.com${modalUri}?X-API-KEY=antd`, 
    { 
      manual: true,
      onError: () => hideModal(),
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
        hideModal(true);
      },
    },
  );

  useEffect(() => {
    if (modalVisible) {
      form.resetFields();
      init.run();
    }
  }, [modalVisible]);

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
        hideModal();
      case 'reset': 
        form.resetFields();
        break;
      default:
        break;
    }
  };
  
  return (
    <AntdModal 
      title={init?.data?.page?.title} visible={modalVisible} 
      onCancel={() => hideModal()}
      footer={ActionBuilder(init?.data?.layout?.actions[0]?.data, actionHandler, request?.loading)}
      maskClosable={false}
      forceRender
    >
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
        {FormBuilder(init?.data?.layout?.tabs[0]?.data)}
        <Form.Item name='uri' key='uri' hidden>
          <Input />
        </Form.Item>
        <Form.Item name='method' key='method' hidden>
          <Input />
        </Form.Item>
      </Form>
    </AntdModal>
  );
};

export default Modal;

