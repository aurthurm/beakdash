'use client';

import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Plus } from 'lucide-react';
import WidgetVisual from '@/app/dashboard/components/widgets/WidgetVisual';
import WidgetEditorModal from '@/app/dashboard/components/widgets/widget-editor/WidgetEditorModal';
import AICopilotButton from '@/app/dashboard/components/AICopilot/AICopilotButton';
import AICopilotChat from '@/app/dashboard/components/AICopilot/AICopilotChat';
import { useWidgetStore } from '@/app/store/widgetStore';
import { IPage, IWidget } from '@/app/lib/drizzle/schemas';
import { useWidget } from '../../hooks/useWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WidgetGrid = ({ page }: { page: IPage }) => {
  const { widgets, updateWidget } = useWidgetStore();
  const [menuWidgets, setMenuWidgets] = useState<IWidget[]>([]);
  const [layouts, setLayouts] = useState({});
  const {isOpen, setIsOpen, isEditingWidget,form, setForm, handlers} = useWidget()

  useEffect(() => {
    // Filter widgets belonging to the current menu item
    const wgts: IWidget[] = widgets.filter((w) => w.pageId === page.id);
    setMenuWidgets(wgts);
    const llll = { lg: wgts?.map(w => ({...w.layout, i: w.id})) }
    setLayouts(llll)
  }, [widgets, page]);

  const handleLayoutChange = (layout: any, updated: any) => {
    setLayouts(updated);
    if(updated?.lg) {
      for(const lay of updated.lg){
        const widget = menuWidgets.find(w => w.id === lay.i)
        if(widget) updateWidget(widget.id!, {...widget, layout: lay})
      }
    };
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">{page?.label} Widgets</h2>
        <div className="flex gap-2">
          <AICopilotButton variant='button' />
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus size={20} />
            Add Widget
          </button>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        draggableHandle='.drag-handle'
      >
        {menuWidgets.map((widget) => (
          <div key={widget.id} id={widget.id} className="bg-white rounded-xl shadow-sm">
            <WidgetVisual 
              widget={widget} 
              onEdit={handlers.handleEdit} 
              onDelete={handlers.handleDelete} 
              onUpdate={handlers.handleUpdate} 
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      <WidgetEditorModal 
          page={page}
         isOpen={isOpen}
         setIsOpen={setIsOpen}
         isEditingWidget={isEditingWidget}
         form={form}
         setForm={setForm}
         handlers={handlers}
      />

      <AICopilotChat />
    </div>
  );
};

export default WidgetGrid;
