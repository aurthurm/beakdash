import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import { LayoutDashboard } from 'lucide-react';
import { MenuState, ImenuItem } from '@/app/types/menu';

export const useMenuStore = create<MenuState>()(
  devtools(
    persist(
      (set) => ({
            items: [{ 
            icon: LayoutDashboard, 
            label: 'Dashboard', 
            active: true
        } as ImenuItem],
        setActive: (item, sub) => {
          set((state) => ({ items: state.items.map(menu => {
                if(menu.label == item.label) {
                    if(menu.submenu) {
                        menu.submenu = [
                          ...menu.submenu?.map(sm => {
                            if(sm.label == sub?.label){
                              sm.active = true;
                            } else {
                              sm.active = false;
                            }
                            return sm;
                          })
                        ]
                    } else {
                        menu.active = true;
                    }
                } else {
                  menu.active = false
                  if(menu.submenu){
                    menu.submenu = [
                      ...menu.submenu?.map(sm => ({...sm, active: false}))
                    ]
                  }
                }
                return menu;
            }) 
          }))
        },
        addMenu: (item) => set((state) => ({ items: [...state.items, item] })),
        addSubMenu: (item, sub) => {
            set((state) => ({ items: state.items.map(menu => {
                if(menu.label == item.label) {
                    if(menu.submenu) {
                        menu.submenu = [...menu.submenu, sub]
                    } else {
                        menu.submenu = [sub]
                    }
                }
                return menu;
            }) 
          }))
        }
      }),
      {
        name: 'menu-storage',
      },
    ),
  ),
)