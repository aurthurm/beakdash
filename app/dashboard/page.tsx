'use client';

import WidgetGrid from '@/app/dashboard/components/widgets/WidgetGrid';
import { usePageStore } from '@/app/store/pageStore'
import { useEffect, useState } from 'react';
import { IPage } from '../lib/drizzle/schemas';
import { useDatasetStore } from '../store/datasets';
import { useConnectionStore } from '../store/connections';
import { useAuth } from '@clerk/nextjs';

export default function Dashboard() {
  const { userId } = useAuth()
  const { pages, activateDashboard } = usePageStore()
  const { fetchDatasets } = useDatasetStore();
  const { fetchConnections } = useConnectionStore();
  const [activePage, setActivePage] = useState({} as IPage);

  useEffect(() => {
    pages.forEach(item => {
      if(item.active) {
        setActivePage(item);
      } else {
        if(item.subpages) {
          item.subpages?.forEach(sp => {
            setActivePage(sp);
          })
        }
      }
    });
  }, [pages]);

  useEffect(() => {
    if(!userId) return;
    fetchDatasets(userId);
    fetchConnections(userId);
  },[userId, fetchDatasets, fetchConnections]);

  return (
    <div className="flex-1 overflow-auto">
      {/* max-w-7xl  */}
      <div className="mx-auto">
        <WidgetGrid page={activePage} initDashboard={activateDashboard} />
      </div>
    </div>
  );
}
