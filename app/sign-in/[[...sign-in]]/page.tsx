'use client';
import React, { useState, useEffect } from 'react';
import { SignIn } from '@clerk/nextjs';
import ReactECharts from 'echarts-for-react';

const chartTypes = ['line', 'bar', 'scatter', 'radar', 'circles'];

const QuadrantChart = ({ quadrantId }: { quadrantId: number }) => {
  const [currentType, setCurrentType] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentType((prev) => (prev + 1) % chartTypes.length);
    }, 3000 + (quadrantId * 500)); // Stagger the animations
    
    return () => clearInterval(timer);
  }, [quadrantId]);

  const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
  ];

  const getOption = () => {
    const baseOption = {
      animation: true,
      animationDuration: 1500,
      tooltip: { show: false },
      grid: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      xAxis: {
        show: false,
        type: 'category',
        data: data.map(item => item.name)
      },
      yAxis: {
        show: false,
        type: 'value'
      }
    };

    const colors = {
      0: '#6366f1', // indigo
      1: '#8b5cf6', // purple
      2: '#ec4899', // pink
      3: '#14b8a6', // teal
    } as Record<number, string>;

    const currentColor = colors[quadrantId];

    switch (chartTypes[currentType]) {
      case 'line':
        return {
          ...baseOption,
          series: [{
            data: data.map(item => item.value),
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: {
              width: 2,
              opacity: 0.15,
              color: currentColor
            },
            areaStyle: {
              opacity: 0.05,
              color: currentColor
            }
          }]
        };
      
      case 'bar':
        return {
          ...baseOption,
          series: [{
            data: data.map(item => item.value),
            type: 'bar',
            itemStyle: {
              opacity: 0.15,
              color: currentColor
            }
          }]
        };
      
      case 'scatter':
        return {
          ...baseOption,
          series: [{
            type: 'scatter',
            data: data.map(item => item.value),
            symbolSize: 20,
            itemStyle: {
              opacity: 0.15,
              color: currentColor
            }
          }]
        };
      
      case 'radar':
        return {
          ...baseOption,
          radar: {
            indicator: data.map(() => ({
              name: '',
              max: 1000
            })),
            splitLine: {
              lineStyle: {
                opacity: 0.05
              }
            },
            axisLine: {
              lineStyle: {
                opacity: 0.05
              }
            }
          },
          series: [{
            type: 'radar',
            symbol: 'none',
            itemStyle: {
              opacity: 0.15,
              color: currentColor
            },
            areaStyle: {
              opacity: 0.05,
              color: currentColor
            },
            data: [{
              value: data.map(item => item.value),
              name: 'Values'
            }]
          }]
        };
      
      case 'circles':
        return {
          ...baseOption,
          series: [{
            type: 'graph',
            layout: 'force',
            animation: true,
            data: data.map((item) => ({
              x: Math.random() * 300,
              y: Math.random() * 300,
              symbolSize: item.value / 20
            })),
            itemStyle: {
              opacity: 0.15,
              color: currentColor
            },
            force: {
              repulsion: 100,
              edgeLength: 50
            },
            links: []
          }]
        };
        
      default:
        return baseOption;
    }
  };

  return (
    <div className="relative h-full w-full">
      <ReactECharts
        option={getOption()}
        style={{ height: '100%', width: '100%' }}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 opacity-50">
        {chartTypes[currentType]}
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Quadrant Charts */}
      <div className="p-24 absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div className="border-b border-r border-gray-100 opacity-80 transition-transform duration-1000 ease-in-out">
          <QuadrantChart quadrantId={0} />
        </div>
        <div className="border-b border-l border-gray-100 opacity-80 transition-transform duration-1000 ease-in-out">
          <QuadrantChart quadrantId={1} />
        </div>
        <div className="border-t border-r border-gray-100 opacity-80 transition-transform duration-1000 ease-in-out">
          <QuadrantChart quadrantId={2} />
        </div>
        <div className="border-t border-l border-gray-100 opacity-80 transition-transform duration-1000 ease-in-out">
          <QuadrantChart quadrantId={3} />
        </div>
      </div>

      {/* Login Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <SignIn />
      </div>
    </div>
  );
};

export default LoginPage;