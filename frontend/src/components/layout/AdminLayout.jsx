import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FaUsers, FaList, FaBox } from 'react-icons/fa';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-slate-800 text-white p-5">
        <div className="pb-5 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white m-0">Admin Dashboard</h2>
        </div>
        <nav className="mt-5 flex flex-col gap-3">
          <Link to="/admin/users" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaUsers className="text-lg" /> 
            <span>User Management</span>
          </Link>
          <Link to="/admin/brands" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaList className="text-lg" /> 
            <span>Brands Management</span>
          </Link>
          <Link to="/admin/tags" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaList className="text-lg" /> 
            <span>Tags Management</span>
          </Link>
          <Link to="/admin/products" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaBox className="text-lg" /> 
            <span>Product Management</span>
          </Link>
          <Link to="/admin/reports" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaList className="text-lg" /> 
            <span>Reports Management</span>
          </Link>
          <Link to="/admin/reports2" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaList className="text-lg" /> 
            <span>Reports Management 2</span>
          </Link>
          <Link to="/admin/reports3" 
            className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-slate-700 transition-colors">
            <FaList className="text-lg" /> 
            <span>Reports Management 3</span>
          </Link>
        </nav>
      </div>
      <div className="flex-1 p-5 bg-gray-500">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;