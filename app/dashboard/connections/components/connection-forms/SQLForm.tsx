import { Input } from '@/app/ui/components/input';
import { Label } from '@/app/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/ui/components/select';


export function SQLForm({ form, setForm }: { form: any; setForm: (form: any) => void }) {
    return (
        <div className="space-y-4">
        <div>
          <Label>Connection Name</Label>
          <Input 
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="My SQL Connection"
          />
        </div>
        <div>
          <Label>Connection String</Label>
          <Input 
            value={form.connectionString}
            onChange={(e) => setForm({...form, connectionString: e.target.value})}
            placeholder="postgresql://user:password@localhost:5432/db"
          />
          <p className="text-sm text-gray-500 mt-1">
            Format: postgresql://user:password@host:port/database
          </p>
        </div>
        <div>
          <Label>Query</Label>
          <textarea 
            className="w-full min-h-[120px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.query}
            onChange={(e) => setForm({...form, query: e.target.value})}
            placeholder="SELECT column1, column2 FROM table WHERE condition"
          />
          <p className="text-sm text-gray-500 mt-1">
            Write your SQL query here. Make sure it returns the required data format.
          </p>
        </div>
        <div>
          <Label>Database Type</Label>
          <Select 
            value={form.dbType} 
            onValueChange={(value) => setForm({...form, dbType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="sqlserver">SQL Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Schema (Optional)</Label>
          <Input 
            value={form.schema}
            onChange={(e) => setForm({...form, schema: e.target.value})}
            placeholder="public"
          />
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