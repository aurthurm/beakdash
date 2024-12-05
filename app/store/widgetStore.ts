import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import { IWidget } from '../lib/drizzle/schemas';

export interface WidgetState {
  widgets: IWidget[];
  addWidget: (item : IWidget) => void;
  updateWidget: (id: string, updates: Partial<IWidget>) => void;
  removeWidget: (id: string) => void;
}


export const useWidgetStore = create<WidgetState>()(
  devtools(
    persist(
      (set) => ({
        widgets: [],
        addWidget: (item) => set((state) => ({ 
          widgets: [...state.widgets, {
            ...item, layout: newItemPosition(state.widgets, item.type)
          }] 
        })),
        updateWidget: (id, updates) =>
          set((state) => ({
            widgets: [...state.widgets.map((w) =>
              w.id === id ? { ...w, ...updates } : w
            )],
          })),
        removeWidget: (id) =>
          set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== id),
          })),
      }),
      {
        name: 'widget-storage',
      },
    ),
  ),
)


const newItemPosition = (widgets: IWidget[], type: IWidget['type']) => {
  const layout = widgets?.map(w => w.layout)

  // Find all occupied positions
  const occupiedPositions = new Set();
  layout.forEach(item => {
    for (let x = item.x; x < item.x + item.w; x++) {
      for (let y = item.y; y < item.y + item.h; y++) {
        occupiedPositions.add(`${x},${y}`);
      }
    }
  });

  // Find first available position
  let newX = 0;
  let newY = 0;
  let found = false;

  while (!found) {
    if (!occupiedPositions.has(`${newX},${newY}`)) {
      found = true;
    } else {
      newX++;
      if (newX >= 12) { // Assuming max grid width of 12
        newX = 0;
        newY++;
      }
    }
  }

  return {
    x: newX,
    y: newY,
    w: type != 'count' ? 4 : 2,
    h: type != 'count' ? 3 : 2,
  };
}