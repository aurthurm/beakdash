import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import { IPage } from '../lib/drizzle/schemas';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

interface PageState {
  pages: IPage[]
  bottomPages: IPage[]
  setActive: (pages: IPage, subpage?: IPage, bottom?: boolean) => void
  addPage: (pages : IPage) => void
  fetchPages: (userId: string) => void
  addSubPage: (pages: IPage, subpage : IPage) => void,
  lastFetch: number
}


export const usePageStore = create<PageState>()(
  devtools(
    persist(
      (set, get) => ({
        pages: [{ 
            icon: 'LayoutDashboard', 
            label: 'Dashboard', 
            route: '/dashboard',
            active: true,
            userId: ''
        }],
        bottomPages: [
          { 
              icon: 'Database', 
              label: 'Datasets', 
              route: '/dashboard/datasets',
              active: false,
              userId: ''
          },
          { 
              icon: 'PlugZap', 
              label: 'Connections', 
              route: '/dashboard/connections',
              active: false,
              userId: ''
          },
          { 
              icon: 'SettingsIcon', 
              route: '/dashboard/settings',
              label: 'Settings', 
              active: false,
              userId: ''
          }
        ],
        lastFetch: 0,
        setActive: (page, sub) => {
          set((state) => ({ 
            pages: state.pages.map(menu => {
              if(menu.label == page.label) {
                  if(menu.subpages) {
                      menu.subpages = [
                        ...menu.subpages?.map(sm => {
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
                if(menu.subpages){
                  menu.subpages = [
                    ...menu.subpages?.map(sm => ({...sm, active: false}))
                  ]
                }
              }
              return menu;
            }),
            bottomPages: state.bottomPages.map(menu => {
              if(menu.label == page.label) {
                  menu.active = true;
              } else {
                  menu.active = false;
              }
              return menu;
            }) 
          }))
        },
        fetchPages: async (userId?: string) => {
          const now = Date.now();
          const store = get();
          
          // Check cache freshness
          if (
            store.pages.length > 1 && 
            now - store.lastFetch < CACHE_TIME
          ) {
            return;
          } 
          set({ lastFetch: now });

          try {
            const response = await fetch(`/api/pages?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch pages');
            const data = await response.json();
            set(state => ({
              pages: [state.pages[0], ...data.map((page: IPage) => ({...page, active: false}))],
            }));
          } catch (error) {
            console.error(error)
          }
        },
        addPage: async (page) => {
          try {
            const response = await fetch('/api/pages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(page)
            });
            
            if (!response.ok) throw new Error('Failed to add page');
            const data = await response.json();
            set((state) => ({ pages: [...state.pages, data] }))
          } catch (error) {
            console.error(error)
          }
        },
        addSubPage: (page, sub) => {
            set((state) => ({ pages: state.pages.map(menu => {
                if(menu.label == page.label) {
                    if(menu.subpages) {
                        menu.subpages = [...menu.subpages, sub]
                    } else {
                        menu.subpages = [sub]
                    }
                }
                return menu;
            }) 
          }))
        }
      }),
      {
        name: 'page-storage',
      },
    ),
  ),
)