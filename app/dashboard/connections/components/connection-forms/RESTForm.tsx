import { Input } from '@/app/ui/components/input';
import { Label } from '@/app/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/ui/components/select';


export function RESTForm({ form, setForm }: { form: any; setForm: (form: any) => void }) {
    return (
        <div className="space-y-4">
            <div>
            <Label>Connection Name</Label>
            <Input 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="My REST API Connection"
            />
            </div>
            <div>
            <Label>Endpoint URL</Label>
            <Input 
                value={form.endpoint}
                onChange={(e) => setForm({...form, endpoint: e.target.value})}
                placeholder="https://api.example.com/data"
            />
            </div>
            <div>
            <Label>Method</Label>
            <Select 
                value={form.method}
                onValueChange={(value) => setForm({...form, method: value})}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
            </Select>
            </div>
            <div>
            <Label>Headers</Label>
            <textarea 
                className="w-full min-h-[100px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={JSON.stringify(form.headers, null, 2)}
                onChange={(e) => {
                try {
                    const headers = JSON.parse(e.target.value);
                    setForm({...form, headers});
                } catch (error) {
                    // Handle invalid JSON
                }
                }}
                placeholder={'{\n  "Authorization": "Bearer token",\n  "Content-Type": "application/json"\n}'}
            />
            <p className="text-sm text-gray-500 mt-1">
                Enter headers as JSON object
            </p>
            </div>
            <div>
            <Label>Request Body (for POST)</Label>
            <textarea 
                className="w-full min-h-[100px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={JSON.stringify(form.body, null, 2)}
                onChange={(e) => {
                try {
                    const body = JSON.parse(e.target.value);
                    setForm({...form, body});
                } catch (error) {
                    // Handle invalid JSON
                }
                }}
                placeholder={'{\n  "key": "value"\n}'}
                disabled={form.method !== 'POST'}
            />
            <p className="text-sm text-gray-500 mt-1">
                Enter request body as JSON object (only for POST requests)
            </p>
            </div>
            <div>
            <Label>Data Path (JSONPath)</Label>
            <Input 
                value={form.dataPath}
                onChange={(e) => setForm({...form, dataPath: e.target.value})}
                placeholder="$.data.items"
            />
            <p className="text-sm text-gray-500 mt-1">
                JSONPath expression to extract data from response
            </p>
            </div>
            <div>
            <Label>Refresh Interval (ms)</Label>
            <Input 
                type="number"
                value={form.refreshInterval}
                onChange={(e) => setForm({...form, refreshInterval: parseInt(e.target.value)})}
                placeholder="5000"
            />
            <p className="text-sm text-gray-500 mt-1">
                How often to refresh the data. Use 0 for manual refresh only.
            </p>
            </div>
        </div>
    );
  }