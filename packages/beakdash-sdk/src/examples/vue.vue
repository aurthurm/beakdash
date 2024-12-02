<template>
  <div :id="containerId"></div>
</template>

<script>
import { DashboardWidgetSDK } from 'dashboard-widget-sdk';

export default {
  name: 'DashboardWidget',
  props: {
    widgetId: String,
    theme: String
  },
  computed: {
    containerId() {
      return `widget-${this.widgetId}`;
    }
  },
  mounted() {
    const dashboard = DashboardWidgetSDK.initialize('https://api.yourdashboard.com');
    dashboard.loadWidget({
      containerId: this.containerId,
      apiKey: process.env.VUE_APP_DASHBOARD_API_KEY,
      widgetId: this.widgetId,
      theme: this.theme,
    });
  },
  beforeDestroy() {
    DashboardWidgetSDK.destroy(this.widgetId);
  }
};
</script>