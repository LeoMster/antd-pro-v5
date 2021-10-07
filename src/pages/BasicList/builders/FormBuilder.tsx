import { DatePicker, Form, Input, Switch, TreeSelect } from 'antd';

const FormBuilder = (data: BasicListApi.Field[] | undefined) => {
  return (data || []).map(field => {
    const basicAttr = {
      label: field.title,
      name: field.key,
      key: field.key,
    };
    switch (field.type) {
      case 'text':
        return (
          <Form.Item {...basicAttr}>
            <Input disabled={field.disabled} />
          </Form.Item>
        );
      case 'datetime':
        if (field.key !== 'update_time') {
          return (
            <Form.Item {...basicAttr}>
              <DatePicker showTime />
            </Form.Item>
          );
        }
        return null;
      case 'tree': 
        return (
          <Form.Item {...basicAttr}>
            <TreeSelect treeData={field.data} treeCheckable />
          </Form.Item>
        );
      case 'switch':
        return (
          <Form.Item {...basicAttr} valuePropName='checked'>
            <Switch />
          </Form.Item>
        );
      default:
        return null;
    }
  });
}

export default FormBuilder;
