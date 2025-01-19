import { IWidget } from "../drizzle/schemas";

// Common options shared across all chart types 
export const getCommonOptions = () => ({
  height: '100%',
  autoFit: true,
  animation: true,
  legend: true,
});

// Base options specific for a given chart type
export const getBaseOptions = (widget: IWidget) => {
    const options =widget.transformConfig.options;

    switch (widget.type) {
      case 'line':
        return {
          point: {
            shapeField: 'square',
            sizeField: 4,
          },
          interaction: {
            tooltip: {
              marker: true,
            },
          },
          style: {
            lineWidth: 2,
          },
        };
  
      case 'bar':
        return {};
  
      case 'column':
        return {};

      case 'scatter':
        return {
          sizeField: 5,
          style: { fillOpacity: 0.3, lineWidth: 1 },
          shapeField: 'hollow', // point
        };

      case 'dual-axes':
        return {};

      case 'pie':
        return {
          label: {
            text: options?.angleField ?? options?.xField,
            style: {
              fontWeight: 'bold',
            },
          },
          radius: 0.8,
          innerRadius: 0.4, // Donut chart
          style: {
            stroke: '#fff',
            inset: 1,
            radius: 10,
          },
          // scale: {
          //   color: {
          //     palette: 'spectral',
          //     offset: (t :number) => t * 0.8 + 0.1,
          //   },
          // },
        };

      default:
        return {};
    }
  };