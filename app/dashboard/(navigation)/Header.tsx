'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Bell, ShoppingBag, Menu, LogOut, User, Plus } from 'lucide-react';
import AddPageModal from '@/app/dashboard/(navigation)/AddPageModal'
import { usePageStore } from '@/app/store/pageStore'
import { SignedIn, UserButton, useUser, useClerk } from '@clerk/nextjs'

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { addPage } = usePageStore()
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className="bg-white rounded-xl mb-4 sticky top-0 z-10">
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center justify-start gap-x-4">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={onToggleSidebar}
          >
            <Menu size={20} />
          </button>
          <button
            onClick={() => setIsAddPageOpen(true)}
            className="flex items-center gap-2 px-2 py-1 text-blue-400 rounded-lg hover:text-blue-600 border border-blue-400"
          >
            <Plus size={20} />
            Page
          </button>
        </div>

        <div className="flex-1 max-w-2xl ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Try to searching..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button aria-label="Toggle dark mode" className="p-2 hover:bg-gray-100 rounded-full">
            <Moon size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            {/* <Image src="https://flagcdn.com/w20/gb.png" alt="English" width={20} height={20} /> */}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <ShoppingBag size={20} />
            <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              8
            </span>
          </button>
          <button aria-label="Notification" className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-2 ml-2 p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >

              <SignedIn>
                <UserButton />
                <div className="font-medium">{user?.fullName}</div>
              </SignedIn>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50">
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => signOut({ redirectUrl: '/' })}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-red-600"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddPageModal
        isOpen={isAddPageOpen}
        onClose={() => setIsAddPageOpen(false)}
        onAdd={(item) => {
          addPage(item);
          setIsAddPageOpen(false);
        }}
      />

    </div>
  );
};

export default Header;