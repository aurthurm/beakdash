'use client';

import WidgetGrid from '@/app/dashboard/components/widgets/WidgetGrid';
import { useAuth } from '@clerk/nextjs'
import { usePageStore } from '@/app/store/pageStore'
import { useEffect, useState } from 'react';
import { IPage } from '../lib/drizzle/schemas';
import { redirect } from 'next/navigation';

export default function Dashboard() {
  const { userId } = useAuth()
  const { pages } = usePageStore()
  const [activePage, setActivePage] = useState({} as IPage);

  if (!userId) {
    redirect("/sign-in");
  }

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
        <WidgetGrid page={activePage} />
      </div>
    </div>
  );
}
