import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navbar/Navbar';
import { Footer } from '../components/footer/Footer';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { SiteSettings } from '../types/studio';

interface MainLayoutProps {
  settings: SiteSettings;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ settings }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-zinc-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer settings={settings} />
      <OfflineIndicator />
    </div>
  );
};
