import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ChartAssistantPayload, ChartAssistantResponse } from '@/app/types/copilot';
import { schemas } from '@/app/schemas/transformSchema';
import { z } from 'zod';
import { IDataset, IWidget } from '@/app/lib/drizzle/schemas';
import { newWidgetPosition } from '@/app/lib/utils';
import 'dotenv/config';
import { db } from '@/app/lib/drizzle';
import { eq } from 'drizzle-orm';
import { widgetsTable, widgetSchema } from '@/app/lib/drizzle/schemas';

const responseSchema = z.object({
  transformation: schemas.transformConfSQL,
  chartTitle: z.string().describe('Title of the chart'),
  chartSubtitle: z.string().optional().describe('Subtitle of the chart'),
  explanation: z.string().describe('Explanation of the configuration'),
  chartQuery: z.string().describe('A query that can be used to generate the chart to be executed on the dataset (Must be schema aware)'),
});

type IResponseSchema = z.infer<typeof responseSchema>;

export async function POST(req: Request) {
    try {
      const payload: ChartAssistantPayload = await req.json();

      const systemPrompt = getSystemPrompt(payload.mode, payload.dataset, payload.widget);

      const result = await generateObject({
        model: openai('gpt-4-turbo'),
        schema: z.object({
          configs: z.array(responseSchema).describe('Chart Widget Configurations'),
          message: z.string().optional().describe('Assistant message, explain what you did in simple terms without getting technical'),
          suggestions: z.string().optional().describe('Suggestions if necessary'),
        }),
        mode: 'json',
        prompt: payload.prompt,
        system: systemPrompt,
      });
  
      try {
        const outputs = result.object;

        const widgets = await saveChartConfigs(outputs.configs, payload);
        
        const finalResponse: ChartAssistantResponse = {
          message: outputs.message ?? 'Generated chart configurations',
          suggestions: outputs.suggestions,
          widgets,
        };
  
        return NextResponse.json(finalResponse);
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'Failed to create cgarts from configurations';
        console.error(errMessage);
        return NextResponse.json(
          { error: errMessage },
          { status: 422 }
        );
      }
    } catch (error) {
      console.error('Chart Assistant Error:', error);
      return NextResponse.json(
        { error: 'Error in chart configuration generation' },
        { status: 500 }
      );
    }
  }
  
function getSystemPrompt(mode: 'create' | 'edit', dataset: IDataset, widget?: IWidget): string {
  return `You are an expert data visualization assistant that generates chart configurations.  
  ${mode === 'edit' 
    ? 'Modify the existing configuration while preserving its useful aspects. Explain your changes clearly.'
    : 'Generate new configurations that best represent the data and answer the user\'s needs.'
  }

  ## Guidelines:
  1. Supported chart types: bar, line, pie.
  2. Use appropriate aggregations for large datasets.
  3. Configure meaningful series.
  4. Add useful filters and sorting.
  5. Ensure all property names and types match exactly as specified in the dataset.
  6. Each configuration should have a title, subtitle, and explanation.
  7. Generate an appropriate schema aware chart query (e.g., ... from public.xxx ...),.
  8. Provide suggestions for follow-up prompts or other relevant information.
  9. If the dataset is incomplete, suggest exploratory steps or clarification prompts.
  10. Note that each transformation belongs to a specific chart type and will generate only a single chart.
  
  ## Dataset Details:
  ${JSON.stringify(dataset)}
  
  ${widget ? `## Existing Configuration: \n${JSON.stringify(widget.transformConfig)}` : ''}
  `;
}

const saveChartConfigs = async (configs: IResponseSchema[], extras: ChartAssistantPayload): Promise<IWidget[]> => {
    // Save the generated chart configurations to the database
    // post to /api/widgets with type widgetSchema
    const resunResults: IWidget[] = [];
    if(extras.mode === 'create') {
      const widgets = await db.select().from(widgetsTable).where(eq(widgetsTable.pageId, extras.pageId!));

      for(const config of configs) {
        const nextLayout = newWidgetPosition(widgets as IWidget[], config.transformation.type);
        const payload = {
            pageId: extras.pageId,
            userId: extras.userId,
            type: config.transformation.type,
            title: config.chartTitle,
            subtitle: config.chartSubtitle,
            layout: nextLayout,
            datasetId: extras.dataset.id,
            query: config.chartQuery,    
            transformConfig: (() => {
              /* eslint-disable @typescript-eslint/no-unused-vars */
              const { type, ...rest } = config.transformation; // Exclude 'type'
              return rest;
            })(),
        }
        const validated = widgetSchema.parse(payload);
        const widgetResponse = await db.insert(widgetsTable)
        .values({ ...validated, createdAt: new Date(), updatedAt: new Date() })
        .returning();

        resunResults.push(widgetResponse[0] as IWidget);
      }
    } else {
      // Edit mode
      for(const config of configs) {
        const payload = {
          ...extras.widget!,
          title: config.chartTitle ?? extras.widget!.title,
          subtitle: config.chartSubtitle ?? extras.widget!.subtitle,
          type: config.transformation.type ?? extras.widget!.type,
          query: config.chartQuery ?? extras.widget!.query,
          transformConfig: (() => {
            /* eslint-disable @typescript-eslint/no-unused-vars */
            const { type, ...rest } = config.transformation; // Exclude 'type'
            return rest;
          })() ?? extras.widget!.transformConfig,
        }
        const validated = widgetSchema.parse(payload);
        const widgetResponse = await db.update(widgetsTable)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(widgetsTable.id, extras!.widget!.id!))
        .returning();

        resunResults.push(widgetResponse[0] as IWidget);
      }
    }

    console.log('Saved widgets:', JSON.stringify(resunResults, null, 2));
    return resunResults;
  };
