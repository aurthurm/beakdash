'use client';

import WidgetGrid from '@/app/ui/components/widgets/WidgetGrid';
import { useSession } from 'next-auth/react';
import { usePageStore } from '@/app/store/pageStore'
import { use, useEffect, useState } from 'react';
// import { redirect } from "next/navigation";

export default function Dashboard() {
  const { data: session } = useSession()
  const { pages, fetchPages } = usePageStore()
  const [activeMenu, setActiveMenu] = useState({})

  // if (!session) {
  //   redirect("/login");
  // }

  useEffect(() => {
    pages.forEach(item => {
      if(item.active) {
        setActiveMenu(item);
      } else {
        if(item.subpages) {
          item.subpages?.forEach(sp => {
            setActiveMenu(sp);
          })
        }
      }
    });
  }, [pages]);

  useEffect(() => {
    (async () => {
      if(!session?.user?.id) {
        console.log('You must be logged in to fetch pages');
        return;
      }
      fetchPages(session?.user?.id!)
    })();
  }, [session?.user?.id]);

  return (
    <div className="flex-1 overflow-auto">
      {/* max-w-7xl  */}
      <div className="mx-auto">
        <WidgetGrid menuItem={activeMenu} />
      </div>
    </div>
  );
}
