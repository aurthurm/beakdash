// import { useEffect } from 'react';
// import { DashboardWidgetSDK } from 'dashboard-widget-sdk';

// function DashboardWidget({ widgetId, theme }) {
//   useEffect(() => {
//     const dashboard = DashboardWidgetSDK.initialize('https://api.yourdashboard.com');
//     const containerId = `widget-${widgetId}`;

//     dashboard.loadWidget({
//       containerId,
//       apiKey: process.env.DASHBOARD_API_KEY,
//       widgetId,
//       theme,
//       refreshInterval: 30000,
//     });

//     return () => {
//       dashboard.destroy(widgetId);
//     };
//   }, [widgetId, theme]);

//   return <div id={`widget-${widgetId}`} />;
// }
