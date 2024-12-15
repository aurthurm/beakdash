'use client';

import WidgetGrid from '@/app/dashboard/components/widgets/WidgetGrid';
import { usePageStore } from '@/app/store/pageStore'
import { useEffect, useState } from 'react';
import { IPage } from '../lib/drizzle/schemas';

export default function Dashboard() {
  const { pages, activateDashboard } = usePageStore()
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

  return (
    <div className="flex-1 overflow-auto">
      {/* max-w-7xl  */}
      <div className="mx-auto">
        <WidgetGrid page={activePage} initDashboard={activateDashboard} />
      </div>
    </div>
  );
}
