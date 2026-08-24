'use client';

import React from "react";
import { Widget } from "@/lib/db/schema";
import { 
  Card, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  Plus,
  Share2,
  Bot
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncateString } from "@/lib/utils";
import { WidgetHeader } from "@/components/widgets/widget-header";

interface WidgetCardProps {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
  onSaveAsTemplate: () => void;
  onAddToDashboard: () => void;
  onShareWidget?: () => void;  // New prop for sharing/attaching widgets
  onOpenCopilot?: () => void;  // New prop for opening the AI Copilot with widget context
  isTemplate?: boolean;
  showControls?: boolean;
}

export default function WidgetCard({
  widget,
  onEdit,
  onDelete,
  onAddToDashboard,
  onShareWidget,
  onOpenCopilot,
  isTemplate = false,
  showControls = true
}: WidgetCardProps) {

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <WidgetHeader name={truncateString(widget.name, 30)} description={widget.description || undefined} />

          {showControls && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                
                {/* Share/Attach option for regular widgets (not templates) */}
                {!isTemplate && onShareWidget && (
                  <DropdownMenuItem onClick={onShareWidget}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share/Attach</span>
                  </DropdownMenuItem>
                )}
                
                {/* AI Copilot option for all widgets */}
                {onOpenCopilot && (
                  <DropdownMenuItem onClick={onOpenCopilot}>
                    <Bot className="mr-2 h-4 w-4" />
                    <span>Ask AI Copilot</span>
                  </DropdownMenuItem>
                )}
                
                {/* Removed "Save as Template" option as requested */}
                
                {isTemplate && (
                  <DropdownMenuItem onClick={onAddToDashboard}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add to Dashboard</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      {showControls && (
        <CardFooter className="p-3 pt-0 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddToDashboard}
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}