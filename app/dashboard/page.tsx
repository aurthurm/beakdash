'use client';

import WidgetGrid from '@/app/dashboard/components/widgets/WidgetGrid';
import { useSession } from 'next-auth/react';
import { usePageStore } from '@/app/store/pageStore'
import { useEffect, useState } from 'react';
import { IPage } from '../lib/drizzle/schemas';
import { redirect } from 'next/navigation';

export default function Dashboard() {
  const { data: session } = useSession()
  const { pages } = usePageStore()
  const [activePage, setActivePage] = useState({} as IPage);

  if (!session) {
    redirect("/login");
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
