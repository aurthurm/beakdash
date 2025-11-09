import { NextRequest, NextResponse } from 'next/server';

interface ChartRecommendationResponse {
  chartType?: string;
  explanation?: string;
  suggestedConfig?: string;
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

    const systemPrompt = "You are an AI data analyst. Given information about a dataset (column names, data types), your task is to recommend the most appropriate chart type for visualization. Explain your choice clearly and provide a basic configuration mapping dataset columns to chart axes or properties (e.g., x-axis, y-axis, category, value).";

    let response: ChartRecommendationResponse;

    // Simulate Data Fetching and AI Interaction
    if (datasetId === 1) {
      // Simulate dataset with columns: ['category', 'value', 'date']
      // Simulate AI recommendation
      response = {
        chartType: 'bar',
        explanation: 'A bar chart is suitable for comparing values across different categories.',
        suggestedConfig: JSON.stringify({ xField: 'category', yField: 'value' }),
        datasetId: datasetId,
      };
    } else if (datasetId === 2) {
      // Simulate dataset with columns: ['product_name', 'sales', 'region']
      // Simulate AI recommendation
      response = {
        chartType: 'pie',
        explanation: 'A pie chart can effectively show the proportion of sales for different products.',
        suggestedConfig: JSON.stringify({ categoryField: 'product_name', valueField: 'sales' }),
        datasetId: datasetId,
      };
    } else {
      return NextResponse.json({
        message: 'Dataset not found or not suitable for chart recommendation at this time.',
        datasetId: datasetId,
      }, { status: 404 });
    }

    // In a real scenario, you would use the systemPrompt and dataset details to call an AI model.
    // For example:
    // const aiModelResponse = await callAiModel(systemPrompt, { datasetColumns: simulatedDataset.columns });
    // And then parse aiModelResponse to set chartType, explanation, suggestedConfig.

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in AI chart recommendation route:', error);
    if (error instanceof SyntaxError) { // Handle cases where req.json() fails
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
