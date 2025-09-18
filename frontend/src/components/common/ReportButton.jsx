import { useState } from 'react';
import api from '../../utils/api.js';
import { Button, Modal, Select, Input, message, Form, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const ReportButton = ({ productId, productTitle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const reportReasons = [
    "Inappropriate Content",
    "Scam or Fraud", 
    "Spam",
    "Wrong Category",
    "Other"
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Please login to report this product');
        return;
      }

      await api.post(`/api/reports`, { //LASTEST
        productId,
        reason: values.reason,
        message: values.message || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Report submitted successfully. Thank you for helping us maintain a safe marketplace.');
      setIsModalOpen(false);
      form.resetFields();
      
    } catch (error) {
      console.error('Error submitting report:', error);
      
      if (error.response?.status === 400) {
        message.error(error.response.data.message || 'Invalid report data');
      } else if (error.response?.status === 401) {
        message.error('Please login to report this product');
      } else if (error.response?.status === 404) {
        message.error('Product not found');
      } else {
        message.error('Failed to submit report. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <>
      <Button 
        icon={<ExclamationCircleOutlined />}
        onClick={() => setIsModalOpen(true)}
        type="text"
        danger
        size="small"
      >
        Report
      </Button>
      
      <Modal
        title="Report Product"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={500}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Reporting: <Text strong>{productTitle}</Text>
          </Text>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="reason"
            label="Reason for reporting"
            rules={[
              { required: true, message: 'Please select a reason for reporting' }
            ]}
          >
            <Select 
              placeholder="Select a reason"
              size="large"
            >
              {reportReasons.map(reason => (
                <Option key={reason} value={reason}>
                  {reason}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="message"
            label="Additional details (optional)"
            extra="Please provide more details about why you're reporting this product"
          >
            <TextArea
              rows={4}
              placeholder="Describe the issue in more detail..."
              maxLength={500}
              showCount
              style={{ resize: 'none' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              onClick={handleCancel}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              danger
            >
              Submit Report
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ReportButton;
