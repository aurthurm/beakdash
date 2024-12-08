import React, { useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { X } from 'lucide-react';
import { useDebounce } from '@/app/lib/hooks/useDebounce';
import { renderIcon } from '@/app/ui/components/icons/Icon';

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelectIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Get all icon names from lucide-react

    // Get common icons for better performance
  

  const iconList = useMemo(() => {
    // return Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon').sort();
    const COMMON_ICONS = [
      'Home', 'User', 'Settings', 'File', 'Folder', 'Calendar',
      'Mail', 'Bell', 'Search', 'Database', 'Users',
      'Activity', 'AlertCircle', 'ArrowRight', 'Check', 'Clock',
      'Cloud', 'Code', 'Copy', 'Edit', 'Eye', 'Filter', 'Globe',
      'Heart', 'Image', 'Link', 'List', 'Lock', 'Map', 'Menu',
      'Monitor', 'Moon', 'Phone',
      'Pin', 'Plus', 'Power', 'Save', 'Share', 'Star',
      'Sun', 'Trash', 'Unlock', 'Upload', 'Video', 'Wallet', 'Zap'
    ];
    return COMMON_ICONS.filter(key => key !== 'createLucideIcon').sort();
  }, []);

  // Filter icons based on search
  const debouncedSearch = useDebounce(search, 300);
  const filteredIcons = useMemo(() => {
    const xx = iconList.filter(icon =>
      icon.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    return xx;
  }, [iconList, debouncedSearch]);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true)}
        }
        className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
      >
        {selectedIcon ? (
          <>
            {renderIcon(selectedIcon)}
            <span>{selectedIcon}</span>
          </>
        ) : (
          'Select Icon...'
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Icon</h3>
              <button
                aria-label="Close icon selector"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <Command className="w-full">
              <Command.Input 
                placeholder="Search icons..."
                value={search}
                onValueChange={setSearch}
                className="w-full p-2 border rounded-lg mb-4"
              />

              <Command.List className="max-h-96 overflow-auto">
                <div className="grid grid-cols-4 gap-2">
                  {filteredIcons.map(iconName => (
                    <Command.Item
                      key={iconName}
                      value={iconName}
                      onSelect={() => {
                        onSelectIcon(iconName);
                        setIsOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                        selectedIcon === iconName ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      {renderIcon(iconName)}
                      <span className="text-xs truncate w-full text-center">
                        {iconName}
                      </span>
                    </Command.Item>
                  ))}
                </div>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSelector;