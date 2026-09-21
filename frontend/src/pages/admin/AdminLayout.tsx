import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { DashboardHeader } from '../../components/layout/DashboardHeader';
import { SidebarProvider } from '../../context/SidebarContext';

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
