import { Space, Tag } from 'antd';
import moment from 'moment';
import ActionBuilder from './ActionBuilder';

const ColumnBuilder = (
  tableColumn: BasicListApi.Field[] | undefined, 
  actionHandler: BasicListApi.ActionHandler,
) => {
  const newColumns: BasicListApi.Field[] = [];
  (tableColumn || []).forEach(column => {
    if (column.hideInColumn !== true) {
      switch (column.type) {
        case 'datetime':
          column.render = (value: string) =>
            moment(value).format('YYYY-MM-DD HH:mm:ss');
          break;
        case 'switch':
          column.render = (value: number) => {
            const option = (column.data || []).find((item: any) => item.value = value);
            return (
              <Tag color={value ? 'blue' : 'red'}>{option?.title}</Tag>
            );
          };
          break;
        case 'actions':
          column.render = (_: any, record: any) => {
            return (
              <Space>{ActionBuilder(column.actions, actionHandler, false, record)}</Space>
            );
          };
          break;
        default:
          break;
      }
      newColumns.push(column);
    }
  });
  const idColumn: BasicListApi.Field[]= [{
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    sorter: true,
  }];
  return idColumn.concat(newColumns);
};

export default ColumnBuilder;