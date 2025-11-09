import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, context, datasetId, chartType, widgetContext } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is missing' }, { status: 400 });
    }

    const systemPrompt = `You are Dasher Assistant, an AI expert in data visualization and dashboard design. Your goal is to help users create insightful and clear dashboards. Be friendly, explain concepts simply, and guide users towards making good data visualization choices. If you are given context about a specific widget or dataset, try to incorporate that into your advice. Do not make up data or specific values. You can also explain existing charts based on their type and configuration, helping users understand what the chart represents.`;

    // Prepare messages for the AI model (not used in simulation)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context || []).map((msg: { role: string; content: string }) => msg), // Add conversation history
      { role: 'user', content: prompt },
    ];

    let aiResponse = ""; // Initialize as empty, to be populated by specific logic

    const lowerCasePrompt = prompt.toLowerCase();

    if (widgetContext && lowerCasePrompt.includes("please explain my current chart")) {
      const { name, type, config } = widgetContext;
      aiResponse = `Okay, let's look at your chart named '**${name}**'. It's a **${type}** chart. `;

      if (config?.xField && config?.yField) {
        aiResponse += `It seems to be showing how **${config.yField}** relates to **${config.xField}**. `;
      } else if (config?.categoryField && config?.valueField) {
        aiResponse += `It looks like it's displaying the proportion of **${config.valueField}** for each **${config.categoryField}**. `;
      } else if (type === 'counter' && config?.valueField) {
        aiResponse += `This KPI counter is displaying the **${config.aggregation || 'value'}** of **${config.valueField}**. `;
      }


      let insight = "";
      switch (type?.toLowerCase()) {
        case 'bar':
        case 'grouped-bar':
        case 'stacked-bar':
          insight = 'comparisons between different categories or groups';
          break;
        case 'line':
        case 'area':
          insight = 'trends over a continuous range, like time';
          break;
        case 'pie':
        case 'donut':
          insight = 'the distribution of parts to a whole';
          break;
        case 'scatter':
          insight = 'the relationship and correlation between two numerical variables';
          break;
        case 'table':
          insight = 'detailed data in a structured, tabular format';
          break;
        case 'counter':
          insight = 'a specific metric or key performance indicator at a glance';
          break;
        default:
          insight = 'general data patterns';
      }
      aiResponse += `You can use this to understand ${insight}. (This is a basic explanation. Deeper insights would require analyzing the actual data.)`;

    } else if (lowerCasePrompt.includes('hello') || lowerCasePrompt.includes('hi')) {
      aiResponse = 'Hello there! How can I help you with your dashboards today?';
      if (widgetContext && widgetContext.name) {
        aiResponse += ` I see you're working on a widget named '${widgetContext.name}'.`;
      } else if (datasetId) {
        aiResponse += ` I can also provide general advice considering your dataset (ID: ${datasetId}).`;
      }
    } else if (lowerCasePrompt.includes('chart type')) {
      aiResponse = 'Bar charts are great for comparing values across different categories. Each bar represents a category, and the length or height of the bar corresponds to its value. They are very versatile!';
       if (widgetContext && widgetContext.name) {
        aiResponse += ` For example, your '${widgetContext.name}' widget could be a bar chart if you're comparing items.`;
      }
    } else {
      // Default response if no specific conditions are met
      aiResponse = "I'm here to help you with your dashboards! Ask me anything about charts, data visualization, or how to get the most out of your data.";
      if (widgetContext && widgetContext.name) {
        aiResponse += ` I see you're working on a widget named '${widgetContext.name}'. Let me know if you have specific questions about it.`;
      } else if (datasetId) {
        aiResponse += ` I can also provide general advice considering your dataset (ID: ${datasetId}).`;
      }
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in AI Copilot route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
