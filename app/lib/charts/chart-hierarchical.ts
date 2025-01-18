import { DataPoint, TransformConf } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

interface HierarchicalNode {
  name: string;
  value: number;
  children: HierarchicalNode[];
}

/**
 * Transforms data for hierarchical charts (tree, sunburst)
 */
export function transformToHierarchical(data: DataPoint[], config: TransformConf): EChartsOption {
    return {
      series: [{
        type: (config.type as any) === 'tree' ? 'tree' : 'sunburst' as const,
        data: buildHierarchy(data)
      }]
    };
}

function buildHierarchy(items: DataPoint[], parentId: any = null): HierarchicalNode[] {
  return items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      name: String(item.name),
      value: Number(item.value),
      children: buildHierarchy(items, item.id)
    }));
}