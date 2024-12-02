import React, { useState, useEffect } from 'react';
import { AlertCircle, Play, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// CodeEditor component with syntax highlighting
const CodeEditor = React.lazy(() => import('@uiw/react-textarea-code-editor'));

const JavaScriptDataSource = () => {
  const [code, setCode] = useState(`// Example: Fetch and transform data
async function getData() {
  // Fetch data from an API
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  
  // Transform data into chart format
  return data.map(item => ({
    x: new Date(item.date).toLocaleDateString(),
    y: item.value
  }));
}

// Return the data
return await getData();`);

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to safely evaluate user code
  const executeCode = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a safe execution context with limited globals
      const sandbox = {
        fetch: window.fetch.bind(window),
        console: {
          log: (...args) => console.log('User code:', ...args),
          error: (...args) => console.error('User code:', ...args),
        },
        Date,
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        RegExp,
        Map,
        Set,
        Promise,
      };

      // Create async function from user code
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const userFunction = new AsyncFunction(
        ...Object.keys(sandbox),
        code
      );

      // Execute code with sandbox
      const data = await userFunction.apply(null, Object.values(sandbox));

      // Validate return data structure
      if (!Array.isArray(data)) {
        throw new Error('Code must return an array of data points');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">JavaScript Data Source</h3>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={executeCode}
              disabled={isLoading}
            >
              <Play className="w-4 h-4 mr-2" />
              Run Code
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <React.Suspense fallback={<div>Loading editor...</div>}>
            <CodeEditor
              value={code}
              language="javascript"
              onChange={(e) => setCode(e.target.value)}
              padding={15}
              style={{
                fontSize: 14,
                backgroundColor: "#f5f5f5",
                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
              }}
              className="min-h-[300px] rounded-md"
            />
          </React.Suspense>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Preview:</h4>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Example templates */}
      <Card className="p-4">
        <h4 className="font-semibold mb-2">Example Templates</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setCode(`// Fetch stock price data
async function getData() {
  const response = await fetch('https://api.example.com/stocks/AAPL');
  const data = await response.json();
  
  return data.prices.map(price => ({
    x: new Date(price.date).toLocaleDateString(),
    y: price.close
  }));
}

return await getData();`)}
          >
            Stock Price Data
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setCode(`// Generate random time series
function getData() {
  const points = 30;
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < points; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      x: date.toLocaleDateString(),
      y: Math.random() * 100
    });
  }
  
  return data.reverse();
}

return getData();`)}
          >
            Random Time Series
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setCode(`// Transform CSV data
async function getData() {
  const response = await fetch('/api/my-csv');
  const text = await response.text();
  
  // Parse CSV
  const rows = text.trim().split('\\n');
  const headers = rows[0].split(',');
  
  return rows.slice(1).map(row => {
    const values = row.split(',');
    return {
      x: values[0], // First column
      y: parseFloat(values[1]) // Second column
    };
  });
}

return await getData();`)}
          >
            CSV Transformation
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default JavaScriptDataSource;