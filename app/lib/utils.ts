import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { IWidget } from "./drizzle/schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function for layout positioning
export const newWidgetPosition = (widgets: IWidget[], type: IChart) => {
  const layout = widgets?.map(w => w.layout);

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
    w: type !== 'count' ? 4 : 2,
    h: type !== 'count' ? 3 : 2,
  };
};