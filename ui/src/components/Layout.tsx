import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#09090b]">
        {/* Subtle top shadow/gradient for depth */}
        <div className="sticky top-0 z-10 w-full h-16 bg-gradient-to-b from-[#09090b] to-transparent pointer-events-none" />
        <div className="p-6 md:p-8 md:ml-64 max-w-7xl mx-auto mt-[-4rem]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
