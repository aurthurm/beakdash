'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/dashboard/(navigation)/Sidebar';
import Header from '@/app/dashboard/(navigation)/Header';
import AuthProvider from '@/app/ui/providers/auth';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-100">
        <div className="p-4 h-full">
          <Sidebar isOpen={isSidebarOpen} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <Header 
            isSidebarOpen={isSidebarOpen} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
          {children}
        </div>
      </div>
    </AuthProvider>
  );
};

export default DashboardLayout;