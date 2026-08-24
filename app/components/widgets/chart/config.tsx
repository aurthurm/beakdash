import { ChartType, WidgetConfigSchema } from "@/lib/db/schema";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

interface ChartConfigProps {
  chartType: ChartType;
  config: WidgetConfig;
  onChange: (config: Partial<WidgetConfig>) => void;
}

export default function ChartConfig({ 
  chartType, 
  config, 
  onChange 
}: ChartConfigProps) {
  
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value } as Partial<WidgetConfig>);
  };

  const updateNestedConfig = (parent: string, key: string, value: any) => {
    const parentObj = (config[parent as keyof WidgetConfig] || {}) as Record<string, any>;
    onChange({ 
      ...config, 
      [parent]: { 
        ...parentObj, 
        [key]: value 
      } 
    } as Partial<WidgetConfig>);
  };
  
  return (
    <div className="space-y-4">
      
      {/* stack */}
      {['bar', 'column', 'area'].includes(chartType) && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="stack"
            checked={config.stack === true}
            onCheckedChange={(checked) => updateConfig("stack", checked)}
          />
          <Label htmlFor="stack">Stacked</Label>
        </div>
      )}
      
      {/* group */}
      {['bar', 'column'].includes(chartType) && (
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              id="group"
              checked={config.group === true || (typeof config.group === 'object')}
              onCheckedChange={(checked) => updateConfig("group", checked)}
            />
            <Label htmlFor="group">Grouped</Label>
          </div>
          {(config.group === true || typeof config.group === 'object') && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="groupReverse"
                  checked={typeof config.group === 'object' ? config.group?.reverse === true : false}
                  onCheckedChange={(checked) => updateNestedConfig("group", "reverse", checked)}
                />
                <Label htmlFor="groupReverse">Reverse Order</Label>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* normalize */}
      {['bar', 'column', 'area'].includes(chartType) && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="normalize"
            checked={config.normalize === true}
            onCheckedChange={(checked) => updateConfig("normalize", checked)}
          />
          <Label htmlFor="normalize">Normalize (100%)</Label>
        </div>
      )}

      {/* lineStyle */}
      {['line'].includes(chartType) && (
        <div>
          <Label htmlFor="lineStyle" className="text-xs">Line Style</Label>
          <Select
            value={config.style?.lineWidth ? String(config.style.lineWidth) : "2"}
            onValueChange={(value) => updateNestedConfig("style", "lineWidth", Number(value))}
          >
            <SelectTrigger id="lineStyle" className="w-full mt-1">
              <SelectValue placeholder="Line Width" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Thin (1px)</SelectItem>
              <SelectItem value="2">Medium (2px)</SelectItem>
              <SelectItem value="3">Thick (3px)</SelectItem>
              <SelectItem value="4">Very Thick (4px)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )} 

      {/* point */}
      {['line'].includes(chartType) && (
        <div>
          <Label htmlFor="pointStyle" className="text-xs">Point Style</Label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="showPoint"
                checked={config.point !== undefined}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateConfig("point", { size: 4 });
                  } else {
                    updateConfig("point", undefined)
                  }
                }}
              />
              <Label htmlFor="showPoint">Show Points</Label>
            </div>
            
            {config.point && (
              <div className="ml-6 space-y-2">
                <div>
                  <Label htmlFor="pointSize" className="text-xs">Point Size</Label>
                  <Select
                    value={config.point?.sizeField ? String(config.point.sizeField) : "4"}
                    onValueChange={(value) => updateNestedConfig("point", "sizeField", Number(value))}
                  >
                    <SelectTrigger id="pointSize" className="w-full mt-1">
                      <SelectValue placeholder="Point Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Small (2px)</SelectItem>
                      <SelectItem value="4">Medium (4px)</SelectItem>
                      <SelectItem value="6">Large (6px)</SelectItem>
                      <SelectItem value="8">Extra Large (8px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pointShape" className="text-xs">Point Shape</Label>
                  <Select
                    value={config.point?.shapeField || "circle"}
                    onValueChange={(value) => updateNestedConfig("point", "shapeField", value)}
                  >
                    <SelectTrigger id="pointShape" className="w-full mt-1">
                      <SelectValue placeholder="Point Shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="triangle">Triangle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      )} 

      {/* tooltip */}
      {['line'].includes(chartType) && (
        <>
        <div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="toolTip"
              checked={Boolean(config.tooltip)}
              onCheckedChange={(checked) => updateConfig("tooltip", checked)}
            />

            <Label htmlFor="toolTip">Enable Tooltip</Label>
          </div>
          {config.tooltip && (
            <div className="ml-6 space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="toolTipMarkers"
                  checked={config.interaction?.tooltip?.marker || false}
                  onCheckedChange={(checked) => updateConfig("interaction", { tooltip: { marker: checked } })}
                />
                <Label htmlFor="toolTipMarkers" className="text-xs">Show Markers</Label>
              </div>
            </div>
          )}
        </div>
        </>
      )} 

      {/* as percent */}
      {['bar', 'column'].includes(chartType) && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="percent"
            checked={config.percent === true}
            onCheckedChange={(checked) => updateConfig("percent", checked)}
          />
          <Label htmlFor="percent">Show as Percentage</Label>
        </div>
      )} 

      {/* Inner Radius */}
      {['pie'].includes(chartType) && (
        <div>
          <Label htmlFor="innerRadius" className="text-xs">Inner Radius (Donut)</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="innerRadius"
              min={0}
              max={0.9}
              step={0.1}
              value={[(config.innerRadius || 0.0)]}
              onValueChange={([value]) => updateConfig("innerRadius", value)}
              className="flex-1"
            />
            <span className="text-xs w-10">{Math.round((config.innerRadius || 0) * 100)}%</span>
          </div>
        </div>
      )} 

      {/* label */}
      {['pie'].includes(chartType) && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="showLabel"
            checked={config.label !== undefined}
            onCheckedChange={(checked) => {
              if (checked) {
                updateConfig("label", { 
                  text: config?.yField, 
                  style: { fontWeight: "bold" } 
                });
              } else {
                // Remove label configuration
                updateConfig("label", undefined);
              }
            }}
          />
          <Label htmlFor="showLabel">Show Labels</Label>
        </div>
      )}

      {/* legend */}
      {['pie'].includes(chartType) && (
        <div>
          <Label htmlFor="legendPosition" className="text-xs">Legend Position</Label>
          <Select
            value={config.legend?.color?.position || "right"}
            onValueChange={(value) => {
              const legendColor = config.legend?.color || {};
              updateNestedConfig("legend", "color", { ...legendColor, position: value });
            }}
          >
            <SelectTrigger id="legendPosition" className="w-full mt-1">
              <SelectValue placeholder="Legend Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="left">Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* dual specific options */}
      {['dual-axes'].includes(chartType) && (
        <div>
        {/* <h3 className="text-sm font-medium mb-2">Dual Axes Configuration</h3> */}
        
        {/* Common X-Field for all axes */}
        {/* <div className="mb-4">
          <Label htmlFor="xField" className="text-xs">X-Field (Common)</Label>
          <Input
            id="xField"
            value={config.xField || ""}
            onChange={(e) => onChange({ ...config, xField: e.target.value } as Partial<WidgetConfig>)}
            placeholder="Common X field (e.g. Month, Date)"
            className="w-full mt-1"
          />
        </div> */}
        
        {/* Child configurations */}
        <div className="space-y-4">
          {(config.children || []).map((child, index) => (
            <div key={index} className="border p-3 rounded-md">
              {/* <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium">Series {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => {
                    const children = [...(config.children || [])];
                    children.splice(index, 1);
                    onChange({ ...config, children } as Partial<WidgetConfig>);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div> */}
              
              <div className="space-y-2">
                {/* Chart Type */}
                {/* <div>
                  <Label htmlFor={`type-${index}`} className="text-xs">Chart Type</Label>
                  <Select
                    value={child.type || "line"}
                    onValueChange={(value) => {
                      const children = [...(config.children || [])];
                      children[index] = { ...children[index], type: value };
                      onChange({ ...config, children } as Partial<WidgetConfig>);
                    }}
                  >
                    <SelectTrigger id={`type-${index}`} className="w-full mt-1">
                      <SelectValue placeholder="Chart Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="interval">Bar/Column</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
                
                {/* Y Field */}
                {/* <div>
                  <Label htmlFor={`yField-${index}`} className="text-xs">Y Field</Label>
                  <Input
                    id={`yField-${index}`}
                    value={child.yField || ""}
                    onChange={(e) => {
                      const children = [...(config.children || [])];
                      children[index] = { ...children[index], yField: e.target.value };
                      onChange({ ...config, children } as Partial<WidgetConfig>);
                    }}
                    placeholder="Y field name (e.g. Temperature)"
                    className="w-full mt-1"
                  />
                </div> */}
                
                {/* Color */}
                {/* <div>
                  <Label htmlFor={`color-${index}`} className="text-xs">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`color-${index}`}
                      value={child.colorField || ""}
                      onChange={(e) => {
                        const children = [...(config.children || [])];
                        children[index] = { ...children[index], colorField: e.target.value };
                        onChange({ ...config, children } as Partial<WidgetConfig>);
                      }}
                      placeholder="#5470C6"
                      className="flex-1 mt-1"
                    />
                    <Input
                      type="color"
                      value={child.colorField || "#5470C6"}
                      onChange={(e) => {
                        const children = [...(config.children || [])];
                        children[index] = { ...children[index], colorField: e.target.value };
                        onChange({ ...config, children } as Partial<WidgetConfig>);
                      }}
                      className="w-12 mt-1 p-1"
                    />
                  </div>
                </div> */}
                
                {/* Axis Position and Title */}
                {/* <div>
                  <Label htmlFor={`axisPosition-${index}`} className="text-xs">Axis Position</Label>
                  <Select
                    value={child.axis?.y?.position || (index === 0 ? "left" : "right")}
                    onValueChange={(value) => {
                      const children = [...(config.children || [])];
                      const axis = children[index].axis || {};
                      const y = axis.y || {};
                      
                      children[index] = { 
                        ...children[index], 
                        axis: { 
                          ...axis, 
                          y: { ...y, position: value } 
                        } 
                      };
                      onChange({ ...config, children } as Partial<WidgetConfig>);
                    }}
                  >
                    <SelectTrigger id={`axisPosition-${index}`} className="w-full mt-1">
                      <SelectValue placeholder="Axis Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
                
                {/* <div>
                  <Label htmlFor={`axisTitle-${index}`} className="text-xs">Axis Title</Label>
                  <Input
                    id={`axisTitle-${index}`}
                    value={child.axis?.y?.title || ""}
                    onChange={(e) => {
                      const children = [...(config.children || [])];
                      const axis = children[index].axis || {};
                      const y = axis.y || {};
                      
                      children[index] = { 
                        ...children[index], 
                        axis: { 
                          ...axis, 
                          y: { ...y, title: e.target.value } 
                        } 
                      };
                      onChange({ ...config, children } as Partial<WidgetConfig>);
                    }}
                    placeholder="Y axis title"
                    className="w-full mt-1"
                  />
                </div> */}
                
                {/* Line specific options */}
                {child.type === "line" && (
                  <>
                    {/* <div>
                      <Label htmlFor={`shape-${index}`} className="text-xs">Line Shape</Label>
                      <Select
                        value={child.shapeField || "smooth"}
                        onValueChange={(value) => {
                          const children = [...(config.children || [])];
                          children[index] = { ...children[index], shapeField: value };
                          onChange({ ...config, children } as Partial<WidgetConfig>);
                        }}
                      >
                        <SelectTrigger id={`shape-${index}`} className="w-full mt-1">
                          <SelectValue placeholder="Line Shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smooth">Smooth</SelectItem>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="step">Step</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}
                    
                    {/* <div>
                      <Label htmlFor={`lineWidth-${index}`} className="text-xs">Line Width</Label>
                      <Select
                        value={String(child.style?.lineWidth || "2")}
                        onValueChange={(value) => {
                          const children = [...(config.children || [])];
                          const style = children[index].style || {};
                          children[index] = { 
                            ...children[index], 
                            style: { ...style, lineWidth: Number(value) } 
                          };
                          onChange({ ...config, children } as Partial<WidgetConfig>);
                        }}
                      >
                        <SelectTrigger id={`lineWidth-${index}`} className="w-full mt-1">
                          <SelectValue placeholder="Line Width" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Thin (1px)</SelectItem>
                          <SelectItem value="2">Medium (2px)</SelectItem>
                          <SelectItem value="3">Thick (3px)</SelectItem>
                          <SelectItem value="4">Very Thick (4px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}
                    
                    {/* <div>
                      <Label htmlFor={`lineDash-${index}`} className="text-xs">Line Style</Label>
                      <Select
                        value={child.style?.lineDash ? "dashed" : "solid"}
                        onValueChange={(value) => {
                          const children = [...(config.children || [])];
                          const style = children[index].style || {};
                          children[index] = { 
                            ...children[index], 
                            style: { 
                              ...style, 
                              lineDash: value === "dashed" ? [2, 2] : undefined
                            } 
                          };
                          onChange({ ...config, children } as Partial<WidgetConfig>);
                        }}
                      >
                        <SelectTrigger id={`lineDash-${index}`} className="w-full mt-1">
                          <SelectValue placeholder="Line Style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}
                  </>
                )}
                
                {/* Bar specific options */}
                {/* {child.type === "interval" && (
                  <div>
                    <Label htmlFor={`opacity-${index}`} className="text-xs">Opacity</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        id={`opacity-${index}`}
                        min={0.1}
                        max={1}
                        step={0.1}
                        value={[(child.style?.fillOpacity || 0.8)]}
                        onValueChange={([value]) => {
                          const children = [...(config.children || [])];
                          const style = children[index].style || {};
                          children[index] = { 
                            ...children[index], 
                            style: { ...style, fillOpacity: value } 
                          };
                          onChange({ ...config, children } as Partial<WidgetConfig>);
                        }}
                        className="flex-1"
                      />
                      <span className="text-xs w-10">{Math.round((child.style?.fillOpacity || 0.8) * 100)}%</span>
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          ))}
          
          {/* Add new series button */}
          {/* <button
            type="button"
            onClick={() => {
              const children = [...(config.children || [])];
              const newIndex = children.length;
              
              // Create new child with smart defaults
              const newChild = {
                type: "line",
                yField: `series${newIndex + 1}`,
                colorField: [
                  "#5470C6", "#91CC75", "#EE6666", "#73C0DE", 
                  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC"
                ][newIndex % 8],
                axis: {
                  y: {
                    position: newIndex === 0 ? "left" : "right",
                    title: `Series ${newIndex + 1}`
                  }
                }
              };
              
              children.push(newChild);
              onChange({ ...config, children } as Partial<WidgetConfig>);
            }}
            className="w-full py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            + Add Series
          </button> */}
          </div>
        </div>
      )}
      
      {/* normalize */}
      {['pie'].includes(chartType) && (
        <></>
      )}
      
      {/* Histogram Options */}
      {/* {chartType === "histogram" && (
        <div>
          <h3 className="text-sm font-medium mb-2">Histogram Options</h3>
          <div className="space-y-2">
            <div>
              <Label htmlFor="binField" className="text-xs">Bin Field</Label>
              <Input
                id="binField"
                value={config.binField || ""}
                onChange={(e) => updateConfig("binField", e.target.value)}
                placeholder="Field to bin"
                className="w-full mt-1"
              />
            </div>
            <div>
              <Label htmlFor="binWidth" className="text-xs">Bin Width</Label>
              <Input
                id="binWidth"
                type="number"
                min={1}
                value={config.binWidth || 10}
                onChange={(e) => updateConfig("binWidth", Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div>
              <Label htmlFor="channel" className="text-xs">Channel</Label>
              <Select
                value={config.channel || "count"}
                onValueChange={(value) => updateConfig("channel", value)}
              >
                <SelectTrigger id="channel" className="w-full mt-1">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="mean">Mean</SelectItem>
                  <SelectItem value="median">Median</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="stack"
                checked={config.stack === true || (typeof config.stack === 'object')}
                onCheckedChange={(checked) => updateConfig("stack", checked)}
              />
              <Label htmlFor="stack">Stack Bins</Label>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Box Plot Options */}
      {/* {chartType === "box-plot" && (
        <div>
          <h3 className="text-sm font-medium mb-2">Box Plot Options</h3>
          <div className="space-y-2">
            <div>
              <Label htmlFor="boxType" className="text-xs">Box Type</Label>
              <Select
                value={config.boxType || "box"}
                onValueChange={(value) => updateConfig("boxType", value)}
              >
                <SelectTrigger id="boxType" className="w-full mt-1">
                  <SelectValue placeholder="Box Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="box">Box Plot</SelectItem>
                  <SelectItem value="violin">Violin Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inset" className="text-xs">Inset (Box Width)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="inset"
                  min={0}
                  max={0.5}
                  step={0.1}
                  value={[(config.style?.inset || 0.2)]}
                  onValueChange={([value]) => updateNestedConfig("style", "inset", value)}
                  className="flex-1"
                />
                <span className="text-xs w-10">{Math.round((config.style?.inset || 0.2) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Word Cloud Options */}
      {/* {chartType === "word-cloud" && (
        <div>
          <h3 className="text-sm font-medium mb-2">Word Cloud Options</h3>
          <div className="space-y-2">
            <div>
              <Label htmlFor="spiral" className="text-xs">Layout Spiral</Label>
              <Select
                value={config.layout?.spiral || "archimedean"}
                onValueChange={(value) => updateNestedConfig("layout", "spiral", value)}
              >
                <SelectTrigger id="spiral" className="w-full mt-1">
                  <SelectValue placeholder="Spiral Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="archimedean">Archimedean</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="colorField" className="text-xs">Color Field</Label>
              <Input
                id="colorField"
                value={config.colorField || ""}
                onChange={(e) => updateConfig("colorField", e.target.value)}
                placeholder="Field for word colors"
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>
      )} */}
      
      {/* Common chart options for all types */}
      <div>
        {/* <h3 className="text-sm font-medium mb-2">General Chart Options</h3> */}
        <div className="space-y-2">
          {/* <div>
            <Label htmlFor="xField" className="text-xs">X-Axis Label</Label>
            <Input
              id="xField"
              value={config.xField || ""}
              onChange={(e) => updateConfig("xField", e.target.value)}
              placeholder="Optional X-axis label"
              className="w-full mt-1"
            />
          </div>
          <div>
            <Label htmlFor="yAxisLabel" className="text-xs">Y-Axis Label</Label>
            <Input
              id="yField"
              value={config.yField || ""}
              onChange={(e) => updateConfig("yField", e.target.value)}
              placeholder="Optional Y-axis label"
              className="w-full mt-1"
            />
          </div> */}
          
          {/* X-Axis Scale Options */}
          {/* <div>
            <details className="mt-2">
              <summary className="text-xs font-medium cursor-pointer">X-Axis Scale Options</summary>
              <div className="mt-2 space-y-2 ml-4">
                <div>
                  <Label htmlFor="xPaddingInner" className="text-xs">Padding Inner</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="xPaddingInner"
                      min={0}
                      max={0.9}
                      step={0.1}
                      value={[(config.scale?.x?.paddingInner || 0.1)]}
                      onValueChange={([value]) => {
                        const x = config.scale?.x || {};
                        updateNestedConfig("scale", "x", { ...x, paddingInner: value });
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs w-10">{Math.round((config.scale?.x?.paddingInner || 0.1) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="xPaddingOuter" className="text-xs">Padding Outer</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="xPaddingOuter"
                      min={0}
                      max={0.9}
                      step={0.1}
                      value={[(config.scale?.x?.paddingOuter || 0.1)]}
                      onValueChange={([value]) => {
                        const x = config.scale?.x || {};
                        updateNestedConfig("scale", "x", { ...x, paddingOuter: value });
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs w-10">{Math.round((config.scale?.x?.paddingOuter || 0.1) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="xTickCount" className="text-xs">Tick Count</Label>
                  <Input
                    id="xTickCount"
                    type="number"
                    min={2}
                    max={20}
                    value={config.scale?.x?.tickCount || 5}
                    onChange={(e) => {
                      const x = config.scale?.x || {};
                      updateNestedConfig("scale", "x", { ...x, tickCount: Number(e.target.value) });
                    }}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </details>
          </div> */}
          
          {/* Y-Axis Scale Options */}
          {/* <div>
            <details className="mt-2">
              <summary className="text-xs font-medium cursor-pointer">Y-Axis Scale Options</summary>
              <div className="mt-2 space-y-2 ml-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="yZero"
                    checked={config.scale?.y?.zero !== false}
                    onCheckedChange={(checked) => {
                      const y = config.scale?.y || {};
                      updateNestedConfig("scale", "y", { ...y, zero: Boolean(checked) });
                    }}
                  />
                  <Label htmlFor="yZero">Start at Zero</Label>
                </div>
                <div>
                  <Label htmlFor="yTickCount" className="text-xs">Tick Count</Label>
                  <Input
                    id="yTickCount"
                    type="number"
                    min={2}
                    max={20}
                    value={config.scale?.y?.tickCount || 5}
                    onChange={(e) => {
                      const y = config.scale?.y || {};
                      updateNestedConfig("scale", "y", { ...y, tickCount: Number(e.target.value) });
                    }}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </details>
          </div> */}
        </div>
      </div>
    </div>
  );
}