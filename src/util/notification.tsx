import { notification } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

export const notify = (title: string, description?: string, duration = 5) => {
	notification.open({
		icon: <ExclamationCircleFilled style={{ color: 'red' }} />,
		message: <p color={description ? 'white' : 'red'}>{title}</p>,
		description: <p color="red">{description}</p>,
		duration: duration,
	});
};
