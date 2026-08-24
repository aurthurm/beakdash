'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

import { EditOutlined, DeleteOutlined, SaveOutlined, MoreOutlined } from '@ant-design/icons';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { Widget } from '@/lib/db/schema';
import { WidgetVisual } from '@/components/widgets/widget-visual';
import AICopilot from '@/components/ai/ai-copilot';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';


const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridLayoutProps {
  widgets: Widget[];
  dashboardId: number;
}


export function GridLayoutComponent({ widgets, dashboardId }: GridLayoutProps) {
    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [showCopilot, setShowCopilot] = useState(false);
    
    // Convert widgets to layout items
    const [layouts, setLayouts] = useState(() => {
      const layoutItems = widgets.map(widget => {
        // Ensure position exists
        const position = (widget.position as { x?: number; y?: number; w?: number; h?: number } | null) || {};
        
        // Create a layout item with the saved position or defaults
        const item = {
          i: widget.id.toString(),
          x: position.x !== undefined ? position.x : 0,
          y: position.y !== undefined ? position.y : 0,
          w: position.w !== undefined ? position.w : 6,
          h: position.h !== undefined ? position.h : 4,
          minW: 2,
          minH: 2,
        };
        
        return item;
      });
      
      // Create separate layouts for each breakpoint for better responsiveness
      return { 
        lg: layoutItems,
        md: layoutItems.map(item => ({...item})),
        sm: layoutItems.map(item => ({...item}))
      };
    });
    
    // Track the dimensions of each widget
    const [widgetDimensions, setWidgetDimensions] = useState<Record<string, { width: number, height: number }>>({});
    
    // Track currently resizing widget
    const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);
    
    // Store refs to content containers within each widget
    const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    
    // Helper function to calculate dimensions from grid units
    const calculateDimensionsFromGrid = (item: Layout): { width: number, height: number } => {
      const gridElement = document.querySelector('.react-grid-layout');
      const totalWidth = gridElement ? gridElement.clientWidth : 0;
      const cols = window.innerWidth >= 1200 ? 12 : window.innerWidth >= 996 ? 10 : 6; // Match your breakpoints
      
      const cellWidth = totalWidth / cols;
      const cellHeight = 60; // rowHeight from your grid config
      
      // Account for margins and borders (adjust the offsets as needed)
      const widthOffset = 10;
      const heightOffset = 10;
      
      return {
        width: Math.max(0, (item.w * cellWidth) - widthOffset),
        height: Math.max(0, (item.h * cellHeight) - heightOffset)
      };
    };
    
    // Function to update dimensions of a specific widget
    const updateWidgetDimensions = (widgetId: string) => {
      const contentEl = contentRefs.current[widgetId];
      
      if (contentEl) {
        // Get dimensions of the content container
        const { clientWidth, clientHeight } = contentEl;
        
        // Only update if dimensions are valid (greater than 0)
        if (clientWidth > 0 && clientHeight > 0) {
          setWidgetDimensions(prev => {
            // Check if dimensions have actually changed
            const prevDims = prev[widgetId];
            if (!prevDims || 
                prevDims.width !== clientWidth || 
                prevDims.height !== clientHeight) {
              // Only update if dimensions have changed
              return {
                ...prev,
                [widgetId]: {
                  width: clientWidth,
                  height: clientHeight
                }
              };
            }
            return prev;
          });
        }
      }
    };
    
    // Function to update dimensions for all widgets
    const updateAllWidgetDimensions = () => {
      widgets.forEach(widget => {
        updateWidgetDimensions(widget.id.toString());
      });
    };
    
    // Initial dimension calculation after component mounts and widgets are rendered
    useEffect(() => {
      // Use requestAnimationFrame to ensure the DOM has been painted
      const rafId = requestAnimationFrame(() => {
        updateAllWidgetDimensions();
      });
      
      return () => cancelAnimationFrame(rafId);
    }, []);
    
    // Update dimensions when window resizes
    useEffect(() => {
      const handleResize = () => {
        // Use requestAnimationFrame to avoid excessive updates
        requestAnimationFrame(() => {
          updateAllWidgetDimensions();
        });
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);
    
    // Update dimensions when layout changes
    useEffect(() => {
      // Wait for layout to finish updating
      const timeoutId = setTimeout(() => {
        updateAllWidgetDimensions();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }, [layouts]);
    
    // Save updated layout positions to database
    const saveLayout = async () => {
      try {
        setIsSaving(true);
        setSaveMessage('');
        
        // For each widget, update its position in the database
        const updatePromises = widgets.map(async (widget) => {
          const layoutItem = layouts.lg.find(item => item.i === widget.id.toString());
          
          if (!layoutItem) {
            return Promise.resolve();
          }
          
          // Create position object with explicit values
          const position = {
            x: parseInt(layoutItem.x.toString()),
            y: parseInt(layoutItem.y.toString()),
            w: parseInt(layoutItem.w.toString()),
            h: parseInt(layoutItem.h.toString())
          };
          
          // Make the API request to update the widget
          const response = await fetch(`/api/widgets/${widget.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dashboardId,
              widget: {
                ...widget,
                position
              }
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save widget ${widget.id} position: ${errorText}`);
          }
          
          return response;
        });
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        // Set success message
        setSaveMessage('Layout saved successfully');
        setTimeout(() => setSaveMessage(''), 3000);
        
        // Turn off edit mode after saving
        if (isEditMode) {
          setIsEditMode(false);
        }
      } catch (error) {
        setSaveMessage('Failed to save layout. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };
    
    // Handle layout change - just update layouts without auto-saving
    const onLayoutChange = (currentLayout: Layout[], allLayouts: any) => {
      // Only update layouts if in edit mode
      if (isEditMode) {
        setLayouts(allLayouts);
        // No auto-saving - we'll only save when "Done Editing" is clicked
      }
    };
    
    // Handle resize start
    const onResizeStart = (_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
      setResizingWidgetId(newItem.i);
      
      // Store the initial dimensions when resize starts
      requestAnimationFrame(() => {
        // This ensures we start with accurate dimensions
        updateWidgetDimensions(newItem.i);
      });
    };
    
    // Handle resize
    const onResize = (_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
      if (resizingWidgetId === newItem.i) {
        // Use our helper function to calculate accurate dimensions
        const { width, height } = calculateDimensionsFromGrid(newItem);
        
        // Update dimensions with calculated values
        setWidgetDimensions(prev => ({
          ...prev,
          [newItem.i]: { width, height }
        }));
      }
    };
    
    // Handle resize stop
    const onResizeStop = (_layout: Layout[], _oldItem: Layout, newItem: Layout) => {
      // First, set final dimensions based on grid calculation
      const { width, height } = calculateDimensionsFromGrid(newItem);
      
      setWidgetDimensions(prev => ({
        ...prev,
        [newItem.i]: { width, height }
      }));
      
      // After grid layouts settle, update dimensions from DOM for accuracy
      setTimeout(() => {
        updateWidgetDimensions(newItem.i);
        setResizingWidgetId(null);
      }, 150); // Give the DOM time to settle
    };
    
    // Toggle edit mode
    const toggleEditMode = () => {
      if (isEditMode) {
        // Save layout before turning off edit mode
        saveLayout();
      } else {
        setIsEditMode(true);
      }
    };
    
    // Debug logging to track dimensions
    useEffect(() => {
      console.log('Widget dimensions:', widgetDimensions);
    }, [widgetDimensions]);
    
    const controls = (<>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCopilot(true)}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Copilot
        </Button>

        {isSaving && (
          <div className="flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm">Saving layout...</span>
          </div>
        )}

        {saveMessage && (
          <div className={`px-4 py-2 rounded-md text-sm ${saveMessage.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {saveMessage}
          </div>
        )}
          
        {isEditMode && !isSaving && (
          <p className="ml-4 text-sm text-muted-foreground">
            Drag widgets to reposition or resize them
          </p>
        )}

        {!isSaving && (<button 
          onClick={toggleEditMode}
          className={`${
            isEditMode 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-muted hover:bg-muted/90 text-foreground'
          } px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors`}
        >
          {isEditMode && !isSaving ? (
            <>
              <SaveOutlined style={{ marginRight: 8 }} />
              Save Layout
            </>
          ) : (
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                  <path d="M2 17a5 5 0 0 0 10 0c0-2.5-2.5-5-5-5a5 5 0 0 0-5 5Z" />
                  <path d="M12 17a5 5 0 0 0 10 0c0-2.5-2.5-5-5-5a5 5 0 0 0-5 5Z" />
                  <path d="M7 7a5 5 0 1 0-5 5" />
                  <path d="M17 7a5 5 0 1 0-5 5" />
                </svg>
                Edit Layout
            </div>
          )}
        </button>)}
    </>);
    
    
    return (
      <div className="mb-6">
        {createPortal(controls, document.getElementById('beakdash-controls')!)}
        
        <ResponsiveGridLayout
          className={`layout ${isEditMode ? 'edit-mode' : ''}`}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          containerPadding={[5,5]}
          margin={[5,5]}
          onLayoutChange={onLayoutChange}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeStop={onResizeStop}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          useCSSTransforms={true}
          isBounded={false}
          draggableHandle=".drag-handle"
        >
  
          {widgets.map(widget => {
            const widgetId = widget.id.toString();
            const dimensions = widgetDimensions[widgetId] || { width: 0, height: 0 };
            const isResizing = resizingWidgetId === widgetId;
            
            return (
              <div
                key={widgetId}
                className={`relative group border rounded-xs overflow-hidden bg-card shadow-xs transition-all ${
                  isEditMode ? 'border-amber-500 border-dashed shadow-md' : ''
                } ${isResizing ? 'resizing' : ''}`}
              >
                {/* Buttons shown on hover */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link
                    href={`/dashboard/${dashboardId}/edit-widget/${widget.id}`}
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center"
                    aria-label="Edit widget"
                  >
                    <EditOutlined />
                  </Link>
                  <button
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center"
                    aria-label="More options"
                  >
                    <MoreOutlined />
                  </button>
                  <button
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center"
                    aria-label="AI Copilot"
                  >
                    🤖
                  </button>
                  <button 
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive flex items-center justify-center"
                    aria-label="Delete widget"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
    
                <div 
                  className={`overflow-auto min-h-full ${isEditMode ? 'drag-handle cursor-move bg-amber-50' : ''}`}
                  ref={el => {
                    // Store a reference to the content container
                    contentRefs.current[widgetId] = el;
                    
                    // If this is the first time this ref is set, update dimensions
                    if (el && (!widgetDimensions[widgetId] || widgetDimensions[widgetId].width === 0)) {
                      requestAnimationFrame(() => {
                        updateWidgetDimensions(widgetId);
                      });
                    }
                  }}
                >
                  <WidgetVisual 
                    widget={widget} 
                    dimensions={{width: dimensions.width - 10, height: dimensions.height - 60}}
                    isResizing={isResizing}
                  />
                </div>
              </div>
            );
          })}
  
        </ResponsiveGridLayout>

        {showCopilot && (
          <AICopilot
            onClose={() => setShowCopilot(false)}
            dashboardId={dashboardId}
            activeDatasetId={undefined}
            activeChartType={undefined}
            widgetContext={undefined}
          />
        )}
      </div>
    );
}