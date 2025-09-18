import { useState, useEffect,useMemo } from 'react';
import api from '../../utils/api';
import { format, formatDistanceToNow, isWithinInterval } from 'date-fns';
import { 
  FaClock, 
  FaEye, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaExclamationCircle,
  FaFilter,
  FaSearch,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import ProductCard from '../../components/common/ProductCard';

const AdminReport3 = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reportDetail, setReportDetail] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    reason: 'all',
    dateRange: { start: '', end: '' },
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Status configurations
  const statusConfig = {
    'Pending': { 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      icon: <FaClock className="w-4 h-4" />,
      badge: 'bg-orange-500'
    },
    'Resolved': { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: <FaCheckCircle className="w-4 h-4" />,
      badge: 'bg-green-500'
    },
    'Dismissed': { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: <FaTimesCircle className="w-4 h-4" />,
      badge: 'bg-red-500'
    }
  };

  // Reason configurations
  const reasonConfig = {
    'Inappropriate Content': { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: <FaExclamationTriangle className="w-4 h-4" /> 
    },
    'Scam or Fraud': { 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
      icon: <FaExclamationCircle className="w-4 h-4" /> 
    },
    'Spam': { 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      icon: <FaExclamationTriangle className="w-4 h-4" /> 
    },
    'Wrong Category': { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: <FaExclamationCircle className="w-4 h-4" /> 
    },
    'Other': { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: <FaExclamationCircle className="w-4 h-4" /> 
    }
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
      // Show error notification (you can implement a toast system)
      alert('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (productId, newStatus) => {
  try {
    setUpdateLoading(true);
    await api.patch(`/api/admin/reports/${productId}/status`, { status: newStatus });
    alert(`Reports for product updated to ${newStatus}`);

    // // refresh local state ถ้าจำเป็น
    // setReports(prev =>
    //   prev.map(report =>
    //     report.product === productId
    //       ? { ...report, status: newStatus }
    //       : report
    //   )
    // );
    fetchReports(); // Fetch updated reports from server
    setDetailModalVisible(false);
  } catch (error) {
    console.error('Error updating report:', error);
    alert('Failed to update report status');
  } finally {
    setUpdateLoading(false);
  }
};

  // const handleStatusUpdate = async (reportId, newStatus) => {
  //   try {
  //     setUpdateLoading(true);
  //     await api.patch(`/api/admin/reports/product/${reportId}/status`, { status: newStatus });
  //     alert(`Report ${newStatus.toLowerCase()} successfully`);
      
  //     // Update local state
  //     setReports(prev => prev.map(report => 
  //       report._id === reportId 
  //         ? { ...report, status: newStatus }
  //         : report
  //     ));

  //     setDetailModalVisible(false);
  //   } catch (error) {
  //     console.error('Error updating report:', error);
  //     alert('Failed to update report status');
  //   } finally {
  //     setUpdateLoading(false);
  //   }
  // };


  // const showReportDetail = (report) => {
  //   setSelectedReport(report);
  //   setDetailModalVisible(true);
  // };
  const showReport = (report) => {
    setReportDetail(report);
    setReportModalVisible(true);
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
    }

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const reportDate = new Date(report.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (!isWithinInterval(reportDate, { 
        start: startDate, 
        end: endDate 
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
    resolved: reports.filter(r => r.status === 'Resolved').length,
    dismissed: reports.filter(r => r.status === 'Dismissed').length
  };

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const clearFilters = () => {
    setFilters({ 
      status: 'all', 
      reason: 'all', 
      dateRange: { start: '', end: '' }, 
      search: '' 
    });
    setCurrentPage(1);
  };
  const groupedReports = useMemo(() => {
  const result = {};

  currentReports.forEach(report => {
    const product = report.product;
    if (!product || !product._id) return;

    const id = product._id;
    if (!result[id]) {
      result[id] = {
        product: product,
        count: 0,
        reports: []
      };
    }

    result[id].count += 1;
    result[id].reports.push(report);
  });

  return result;
}, [currentReports]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Management</h1>
        <p className="text-gray-600">
          Manage and review user reports for products and content moderation
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaClock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaTimesCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Dismissed</p>
              <p className="text-2xl font-bold text-red-600">{stats.dismissed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="block text-gray-600 w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div>
            <select
              className="block text-gray-600 w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.reason}
              onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))}
            >
              <option value="all">All Reasons</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Scam or Fraud">Scam or Fraud</option>
              <option value="Spam">Spam</option>
              <option value="Wrong Category">Wrong Category</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              className="block text-gray-600 w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
          </div>

          {/* Date Range End */}
          <div>
            <input
              type="date"
              className="block text-gray-600 w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
            />
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center"
            >
              <FaFilter className="h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {/* </div><div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden"> */}
      <div className="min-h-screen bg-[#f0f2f5] p-6 text-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        ) : (
          <>
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.values(groupedReports).map(group => {
                let backgroundColor = '';
                let borderColor = '';
                if (group.reports[0].status === 'Resolved'){
                  backgroundColor = 'bg-green-50';
                  borderColor = 'border-green-400';
                }else if (group.reports[0].status === 'Dismissed'){
                  backgroundColor = 'bg-red-50';
                  borderColor = 'border-red-400';
                }else{
                  backgroundColor = 'bg-yellow-50';
                  borderColor = 'border-yellow-400';
                }

                return (
                  <>
                  <ProductCard
                    key={group.product._id}
                    product={group.product}
                    reportCount={group.count}
                    reports={group.reports}
                  />


                  <div className={`mt-2 p-2 ${backgroundColor} border-l-4 ${borderColor}`}>
                    <p>🚩 รายงานแล้ว {group.count} ครั้ง</p>
                    <p className="text-sm text-gray-700">
                      เหตุผลยอดนิยม: {group.reports.map(r => r.reason).join(', ')}
                    </p>
                    <button 
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => showReport(group.reports)}
                    >
                      📜 ดูรายงานทั้งหมด
                    </button>
                    <button 
                    className="text-green-600 hover:underline mr-2"
                    onClick={() => handleStatusUpdate(group.product._id, 'Resolved')}
                    >
                      ✅ ลบโพสต์ 
                    </button>
                    <button 
                    className="text-red-600 hover:underline"
                    onClick={() => handleStatusUpdate(group.product._id, 'Dismissed')}
                    >
                       ❌ ละเว้นรายงาน
                    </button>
                  </div>
                </>
              )})}

            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredReports.length)}</span> of{' '}
                    <span className="font-medium">{filteredReports.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Detail Modal onClick={() => showReportDetail(group.reports[0])}*/}
      {detailModalVisible && selectedReport && (
        <div className="fixed inset-0  bg-black/75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
                <button
                  onClick={() => setDetailModalVisible(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedReport._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 flex items-center">
                      <div className={`h-2 w-2 rounded-full ${statusConfig[selectedReport.status]?.badge} mr-2`}></div>
                      <span className="text-sm text-gray-900">{selectedReport.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${reasonConfig[selectedReport.reason]?.color || reasonConfig['Other'].color}`}>
                      {reasonConfig[selectedReport.reason]?.icon}
                      <span className="ml-1">{selectedReport.reason}</span>
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reporter</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedReport.reporter?.username || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{selectedReport.reporter?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedReport.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedReport.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                  </div>
                </div>

                {/* Product Information */}
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900 mb-3">Product Information</h4>
                  {selectedReport.product ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {selectedReport.product.images?.[0] && (
                          <img
                            className="w-20 h-20 rounded object-cover"
                            src={selectedReport.product.images[0]}
                            alt={selectedReport.product.title}
                          />
                        )}
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            {selectedReport.product.title}
                          </h5>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Product has been deleted</p>
                  )}
                </div>

                {/* Additional Details */}
                {selectedReport.message && (
                  <div className="mt-6">
                    <h4 className="text-base font-medium text-gray-900 mb-3">Additional Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{selectedReport.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setDetailModalVisible(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                
                {selectedReport.status !== 'Resolved' && (
                  <button
                    onClick={() => {handleStatusUpdate(selectedReport.product?._id, 'Resolved'),console.log(selectedReport)}}
                    disabled={updateLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {updateLoading ? <FaSpinner className="animate-spin h-4 w-4 mr-2" /> : null}
                    Mark as Resolved
                  </button>
                )}
                
                {selectedReport.status !== 'Dismissed' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedReport.product?._id, 'Dismissed')}
                    disabled={updateLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {updateLoading ? <FaSpinner className="animate-spin h-4 w-4 mr-2" /> : null}
                    Dismiss Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report ALL*/}
      {reportDetail && reportModalVisible && (
        <div className="fixed inset-0  bg-black/75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
                <button
                  onClick={() => setReportModalVisible(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      More Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportDetail.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No reports found
                      </td>
                    </tr>
                  ) : (
                    reportDetail.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {report.reporter?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.reporter?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${reasonConfig[report.reason]?.color || reasonConfig['Other'].color}`}>
                            {reasonConfig[report.reason]?.icon}
                            <span className="ml-1">{report.reason}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.message || 'No additional details provided'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${statusConfig[report.status]?.badge} mr-2`}></div>
                            <span className="text-sm text-gray-900">{report.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div title={format(new Date(report.createdAt), 'yyyy-MM-dd HH:mm:ss')}>
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {setSelectedReport(report); setDetailModalVisible(true); setReportModalVisible(false)}}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <FaEye className="h-3 w-3 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Modal Footer */}
          
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReport3;