import { NextRequest, NextResponse } from 'next/server';

interface KPISuggestion {
  title: string;
  description: string;
  widgetType: 'counter' | 'stat-card' | string; // Allow other widget types
  config: {
    valueField: string;
    aggregation: 'sum' | 'avg' | 'nunique' | 'count' | string; // Allow other aggregations
    prefix?: string;
    suffix?: string;
  };
}

interface KPISuggestionResponse {
  kpiSuggestions?: KPISuggestion[];
  explanation?: string;
  datasetId: number | string;
  error?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { datasetId } = body;

    if (datasetId === undefined || datasetId === null) {
      return NextResponse.json({ error: 'datasetId is missing' }, { status: 400 });
    }

    const systemPrompt = "You are an AI business intelligence analyst. Based on the provided dataset columns, suggest 2-3 relevant Key Performance Indicators (KPIs). For each KPI, provide a title, a brief description of what it measures, a suggested widget type (e.g., 'counter', 'stat-card'), and a simple configuration for its calculation (e.g., column to use, aggregation method like sum, average, count unique).";

    let kpiSuggestions: KPISuggestion[] = [];
    let explanation: string = "";

    // Simulate Data Fetching and AI Interaction
    if (datasetId === 1) {
      // Simulated columns: ['category', 'value', 'date']
      kpiSuggestions = [
        {
          title: "Total Value",
          description: "Sum of all values in the dataset.",
          widgetType: "counter",
          config: { valueField: "value", aggregation: "sum" }
        },
        {
          title: "Unique Categories",
          description: "Count of distinct categories.",
          widgetType: "stat-card",
          config: { valueField: "category", aggregation: "nunique" }
        }
      ];
      explanation = "These KPIs provide an overview of the dataset's scale and diversity.";
    } else if (datasetId === 2) {
      // Simulated columns: ['product_name', 'sales', 'region']
      kpiSuggestions = [
        {
          title: "Total Sales",
          description: "Overall sales revenue.",
          widgetType: "counter",
          config: { valueField: "sales", aggregation: "sum", prefix: "$" }
        },
        {
          title: "Products Sold",
          description: "Count of unique products.",
          widgetType: "stat-card",
          config: { valueField: "product_name", aggregation: "nunique" }
        }
      ];
      explanation = "Tracking these KPIs can help understand sales performance and product variety.";
    } else {
      return NextResponse.json({
        message: 'Dataset not found or not suitable for KPI suggestions.',
        datasetId: datasetId,
      }, { status: 404 });
    }

    // In a real scenario, you would use the systemPrompt and dataset details (column names, types)
    // to call an AI model. For example:
    // const datasetInfo = await getDatasetInfo(datasetId); // Function to fetch dataset schema
    // const aiModelResponse = await callAiModel(systemPrompt, { datasetColumns: datasetInfo.columns });
    // And then parse aiModelResponse to set kpiSuggestions and explanation.

    const response: KPISuggestionResponse = {
      kpiSuggestions,
      explanation,
      datasetId,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in AI KPI suggestion route:', error);
    if (error instanceof SyntaxError) { // Handle cases where req.json() fails
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
