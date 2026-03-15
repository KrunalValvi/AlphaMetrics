import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * AppLayout wraps every authenticated page.
 *
 * Usage:
 *   <AppLayout title="Dashboard">
 *     <div className="page-body">...</div>
 *   </AppLayout>
 */
export default function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
}
