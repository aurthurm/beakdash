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
              <SelectItem value="mysql">MySQL/MariaDB</SelectItem>
            </SelectContent>
          </Select>
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