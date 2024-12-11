'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { usePageStore } from '@/app/store/pageStore'
import { IPage } from '@/app/lib/drizzle/schemas';
import { renderIcon } from '@/app/ui/components/icons/Icon';
import { useAuth, SignedIn, UserButton, useUser } from '@clerk/nextjs'

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {  
  const { userId } = useAuth()
  const { user } = useUser()
  const router = useRouter();
  const pathname = usePathname();
  const { setActive, pages, bottomPages, fetchPages, seedDashboard } = usePageStore()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  useEffect(() => {
    if(!userId) {
      console.log('You must be logged in to fetch pages');
      return;
    }
    fetchPages(userId).then( async (data) => {
      if(data.length == 0) {
        await seedDashboard(userId);
      } else {
        const dashboardPage = data.find((item: IPage) => item.label == 'Dashboard');
        if(!dashboardPage) {
          await seedDashboard(userId);
        }
      }
    });
  }, [fetchPages, seedDashboard, userId]);

  const toggleSubmenu = (menu: IPage) => {
    if (menu.subpages) {
      setExpandedMenus(prev => 
        prev.includes(menu.label) 
          ? prev.filter(item => item !== menu.label)
          : [...prev, menu.label]
      );
    } else {
      setActive(menu)
    }
  };

  const handleMenuClick = (item: IPage, isBottomMenu: boolean = true) => {
    if (isBottomMenu) {
      // Handle bottom menu items (settings, connections, etc.)
      if (item.route && pathname !== item.route) {
        setActive(item)
        router.push(item.route);
      }
    } else {
      // Handle top menu items (dashboard items)
      toggleSubmenu(item);
      // Only navigate if we're not already on dashboard
      if (pathname !== '/dashboard') {
        router.push('/dashboard');
      }
    }
  };

   // Logo click handler
   const handleLogoClick = () => {
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  return (
    <div className={`bg-white rounded-xl h-full transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-20'
    } flex flex-col overflow-hidden`}>
      <div className={`flex items-center gap-2 p-4 ${!isOpen && 'justify-center'}`}
        onClick={handleLogoClick}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl">B</span>
        </div>
        {isOpen && <h1 className="text-xl font-semibold">BeakDash</h1>}
      </div>

      {/* {isOpen && <div className="text-gray-500 text-sm px-4 mb-2">HOME</div>} */}

      <nav className="flex-1 overflow-y-auto">
        {pages.length == 0 && <div className="flex items-center justify-center h-full">Loading Pages...</div>}
        {pages.length > 0 && <div className="px-2">
          {pages.map((item, index) => (
            <div key={index}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 ${
                  item.active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleMenuClick(item, false)}
              >
                {renderIcon(item.icon, 'flex-shrink-0')}
                {isOpen && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.subpages && (
                      <span className="ml-auto">
                        {expandedMenus.includes(item.label) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                    )}
                  </>
                )}
              </div>
              {isOpen && item.subpages && expandedMenus.includes(item.label) && (
                <div className="ml-9 mb-2">
                  {item.subpages.map((subItem, subIndex) => (
                    <div
                      key={subIndex}
                      className={`py-2 px-3 text-sm hover:text-blue-600 cursor-pointer ${
                        item.active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setActive(item, subItem)}
                    >
                      {subItem.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>}
      </nav>
      <nav className="border-t pt-1">
        <div className="px-2">
          {bottomPages.map((item, index) => (
            <div key={index}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 ${
                  item.active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleMenuClick(item, true)}
              >
                {renderIcon(item.icon, 'flex-shrink-0')}
                {isOpen && (<span className="truncate">{item.label}</span>)}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t p-4">
        <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
          {/* <Image
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=48&h=48&q=80"
            alt="Profile"
            className="w-10 h-10 rounded-full flex-shrink-0"
            width={40}
            height={40}
          /> */}
          {isOpen && (
            <SignedIn>
              <UserButton />
              <div className="font-medium">{user?.fullName}</div>
            </SignedIn>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;