'use client';

import WidgetGrid from '@/app/ui/components/widgets/WidgetGrid';
import { useSession } from 'next-auth/react';
import { useMenuStore } from '@/app/store/menu'
import { useEffect, useState } from 'react';
// import { redirect } from "next/navigation";

export default function Dashboard() {
  const { data: session } = useSession()
  const { items } = useMenuStore()
  const [activeMenu, setActiveMenu] = useState({})

  console.log(session)
  // if (!session) {
  //   redirect("/login");
  // }

  useEffect(() => {
    items.forEach(item => {
      if(item.active) {
        setActiveMenu(item);
      } else {
        if(item.submenu) {
          item.submenu?.forEach(sm => {
            setActiveMenu(sm);
          })
        }
      }
    });
  }, [items])

  return (
    <div className="flex-1 overflow-auto">
      {/* max-w-7xl  */}
      <div className="mx-auto">
        <WidgetGrid menuItem={activeMenu} />
      </div>
    </div>
  );
}
