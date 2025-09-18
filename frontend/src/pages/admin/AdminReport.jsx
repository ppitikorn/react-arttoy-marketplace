import { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Button, 
  Modal, 
  Select, 
  message, 
  Space, 
  Avatar, 
  Typography, 
  Image, 
  Descriptions, 
  Badge,
  Row,
  Col,
  Statistic,
  Input,
  DatePicker,
  Tooltip
} from 'antd';
import { 
  ExclamationCircleOutlined, 
  EyeOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FilterOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import { format, formatDistanceToNow, isWithinInterval } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const AdminReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    reason: 'all',
    dateRange: null,
    search: ''
  });

  // Status configurations
  const statusConfig = {
    'Pending': { color: 'orange', icon: <ClockCircleOutlined /> },
    'Reviewed': { color: 'blue', icon: <EyeOutlined /> },
    'Resolved': { color: 'green', icon: <CheckCircleOutlined /> },
    'Dismissed': { color: 'red', icon: <CloseCircleOutlined /> }
  };

  // Reason configurations
  const reasonConfig = {
    'Inappropriate Content': { color: 'red', icon: <WarningOutlined /> },
    'Scam or Fraud': { color: 'purple', icon: <ExclamationCircleOutlined /> },
    'Spam': { color: 'orange', icon: <WarningOutlined /> },
    'Wrong Category': { color: 'blue', icon: <ExclamationCircleOutlined /> },
    'Other': { color: 'default', icon: <ExclamationCircleOutlined /> }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      setUpdateLoading(true);
      await api.patch(`/api/admin/reports/${reportId}/status`,{ status: newStatus });
      message.success(`Report ${newStatus.toLowerCase()} successfully`);
      
      // Update local state
      setReports(prev => prev.map(report => 
        report._id === reportId 
          ? { ...report, status: newStatus }
          : report
      ));

      setDetailModalVisible(false);
    } catch (error) {
      console.error('Error updating report:', error);
      message.error('Failed to update report status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const showReportDetail = (report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    let matchesFilter = true;

    // Status filter
    if (filters.status !== 'all' && report.status !== filters.status) {
      matchesFilter = false;
    }

    // Reason filter
    if (filters.reason !== 'all' && report.reason !== filters.reason) {
      matchesFilter = false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        report.product?.title?.toLowerCase().includes(searchTerm) ||
        report.reporter?.username?.toLowerCase().includes(searchTerm) ||
        report.reporter?.email?.toLowerCase().includes(searchTerm) ||
        report.reason?.toLowerCase().includes(searchTerm) ||
        report.message?.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) {
        matchesFilter = false;
      }
    }    // Date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const reportDate = new Date(report.createdAt);
      const [startDate, endDate] = filters.dateRange;
      if (!isWithinInterval(reportDate, { 
        start: startDate.toDate(), 
        end: endDate.toDate() 
      })) {
        matchesFilter = false;
      }
    }

    return matchesFilter;
  });

  // Calculate statistics
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    reviewed: reports.filter(r => r.status === 'Reviewed').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
    dismissed: reports.filter(r => r.status === 'Dismissed').length
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      width: 250,
      render: (product) => (
        <div className="flex items-center space-x-3">
          {product?.images?.[0] && (
            <Avatar 
              size={40} 
              src={product.images[0]} 
              shape="square"
            />
          )}
          <div>
            <div className="font-medium text-gray-900 truncate max-w-[150px]">
              {product?.title || 'Product Deleted'}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Reporter',
      dataIndex: 'reporter',
      key: 'reporter',
      width: 180,
      render: (reporter) => (
        <div>
          <div className="font-medium text-gray-900">
            {reporter?.username || 'Unknown User'}
          </div>
          <div className="text-sm text-gray-500">
            {reporter?.email}
          </div>
        </div>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 160,
      render: (reason) => {
        const config = reasonConfig[reason] || reasonConfig['Other'];
        return (
          <Tag color={config.color} icon={config.icon}>
            {reason}
          </Tag>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        //const config = statusConfig[status];
        return (
          <Badge 
            status={status === 'Pending' ? 'processing' : status === 'Resolved' ? 'success' : status === 'Dismissed' ? 'error' : 'default'}
            text={status}
          />
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,      render: (date) => (
        <Tooltip title={format(new Date(date), 'yyyy-MM-dd HH:mm:ss')}>
          <span>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showReportDetail(record)}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Report Management</Title>
        <Text type="secondary">
          Manage and review user reports for products and content moderation
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Reports"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Reviewed"
              value={stats.reviewed}
              valueStyle={{ color: '#1890ff' }}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Resolved"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Dismissed"
              value={stats.dismissed}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="Search reports..."
              allowClear
              onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Option value="all">All Status</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Reviewed">Reviewed</Option>
              <Option value="Resolved">Resolved</Option>
              <Option value="Dismissed">Dismissed</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Reason"
              value={filters.reason}
              onChange={(value) => setFilters(prev => ({ ...prev, reason: value }))}
            >
              <Option value="all">All Reasons</Option>
              <Option value="Inappropriate Content">Inappropriate Content</Option>
              <Option value="Scam or Fraud">Scam or Fraud</Option>
              <Option value="Spam">Spam</Option>
              <Option value="Wrong Category">Wrong Category</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </Col>
          <Col span={4}>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => setFilters({ status: 'all', reason: 'all', dateRange: null, search: '' })}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Reports Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} reports`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Report Detail Modal */}
      <Modal
        title="Report Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedReport?.status === 'Pending' && (
            <Button
              key="reviewed"
              loading={updateLoading}
              onClick={() => handleStatusUpdate(selectedReport._id, 'Reviewed')}
            >
              Mark as Reviewed
            </Button>
          ),
          selectedReport?.status !== 'Resolved' && (
            <Button
              key="resolved"
              type="primary"
              loading={updateLoading}
              onClick={() => handleStatusUpdate(selectedReport._id, 'Resolved')}
            >
              Mark as Resolved
            </Button>
          ),
          selectedReport?.status !== 'Dismissed' && (
            <Button
              key="dismissed"
              danger
              loading={updateLoading}
              onClick={() => handleStatusUpdate(selectedReport._id, 'Dismissed')}
            >
              Dismiss Report
            </Button>
          )
        ]}
      >
        {selectedReport && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Report ID" span={2}>
                {selectedReport._id}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={selectedReport.status === 'Pending' ? 'processing' : selectedReport.status === 'Resolved' ? 'success' : selectedReport.status === 'Dismissed' ? 'error' : 'default'}
                  text={selectedReport.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                <Tag color={reasonConfig[selectedReport.reason]?.color || 'default'}>
                  {selectedReport.reason}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reporter">
                {selectedReport.reporter?.username || 'Unknown User'}
              </Descriptions.Item>
              <Descriptions.Item label="Reporter Email">
                {selectedReport.reporter?.email || 'N/A'}
              </Descriptions.Item>              <Descriptions.Item label="Report Date">
                {format(new Date(selectedReport.createdAt), 'yyyy-MM-dd HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {format(new Date(selectedReport.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-4">
              <Title level={5}>Product Information</Title>
              {selectedReport.product ? (
                <Card size="small">
                  <div className="flex items-start space-x-4">
                    {selectedReport.product.images?.[0] && (
                      <Image
                        width={100}
                        height={100}
                        src={selectedReport.product.images[0]}
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {selectedReport.product.title}
                      </Title>
                    </div>
                  </div>
                </Card>
              ) : (
                <Text type="secondary">Product has been deleted</Text>
              )}
            </div>

            {selectedReport.message && (
              <div className="mt-4">
                <Title level={5}>Additional Details</Title>
                <Card size="small">
                  <Paragraph>{selectedReport.message}</Paragraph>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReport;