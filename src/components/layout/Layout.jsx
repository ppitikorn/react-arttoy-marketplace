import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header/> 
      <div className="flex-1 transition-all duration-200 ease-in-out ">
        <main className="pt-16 min-h-[calc(100vh-4rem)] p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;