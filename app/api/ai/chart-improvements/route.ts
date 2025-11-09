import { NextRequest, NextResponse } from 'next/server';

interface WidgetContext {
  id: string | number;
  name?: string;
  type: 'bar' | 'line' | 'pie' | string; // Allow other string types
  config?: any; // Current chart configuration
}

interface ImprovementResponse {
  suggestions: string[];
  explanation: string;
  widgetId: string | number;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const widgetContext = body.widgetContext as WidgetContext;

    if (!widgetContext || !widgetContext.id || !widgetContext.type) {
      return NextResponse.json({ error: 'widgetContext with id and type is required' }, { status: 400 });
    }

    const systemPrompt = "You are an AI data visualization expert. A user will provide you with the details of an existing chart (type, configuration). Your task is to analyze this information and provide 2-3 specific, actionable suggestions to improve its clarity, effectiveness, or visual appeal. Also, provide a brief overall explanation for your suggestions.";

    let suggestions: string[] = [];
    let explanation: string = "";

    // Simulate AI Interaction based on Widget Context
    switch (widgetContext.type.toLowerCase()) {
      case 'bar':
        suggestions = [
          "Consider adding data labels for clarity.",
          "If you have many categories, try a horizontal bar chart.",
          "Explore using a different color palette for better visual appeal."
        ];
        explanation = "These suggestions can help make your bar chart more readable and engaging.";
        break;
      case 'pie':
        suggestions = [
          "Ensure slices are ordered logically (e.g., largest to smallest).",
          "Avoid using pie charts for more than 5-7 categories.",
          "Consider exploding a slice to highlight a key segment."
        ];
        explanation = "Pie charts are best for showing parts of a whole. These tips can improve their effectiveness.";
        break;
      case 'line':
        suggestions = [
          "Add markers for each data point if the number of points isn't too high.",
          "Ensure your time axis is clearly labeled and formatted.",
          "Consider adding a trendline if appropriate."
        ];
        explanation = "Line charts are great for trends. These suggestions can enhance their clarity and impact.";
        break;
      default:
        suggestions = [
          "Ensure your chart has a clear title and axis labels.",
          "Check if the chosen colors are accessible.",
          "Make sure the chart type matches the data story you want to tell."
        ];
        explanation = "General best practices can always help improve a chart.";
        break;
    }

    // In a real scenario, you would use the systemPrompt and widgetContext to call an AI model.
    // For example:
    // const aiModelResponse = await callAiModel(systemPrompt, { chartDetails: widgetContext });
    // And then parse aiModelResponse to set suggestions and explanation.

    const response: ImprovementResponse = {
      suggestions,
      explanation,
      widgetId: widgetContext.id,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in AI chart improvement route:', error);
    if (error instanceof SyntaxError) { // Handle cases where req.json() fails
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
