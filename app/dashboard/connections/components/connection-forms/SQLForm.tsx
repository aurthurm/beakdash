import { useState } from "react";
import { Input } from "@/app/ui/components/input";
import { Label } from "@/app/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/ui/components/select";
import { Switch } from "@/app/ui/components/switch";
import { SQLConnection, SQLDriver } from "@/app/types/datasource";

interface SQLFormProps {
  form: SQLConnection;
  setForm: (form: SQLConnection) => void;
}

export function SQLForm({ form, setForm }: SQLFormProps) {
  const [advanced, setAdvanced] = useState(false);

  const updateForm = (update: Partial<SQLConnection>) => {
    setForm({...form,...update, config: {...form.config, ...update.config}});
  };

  const drivers: SQLDriver[] = ['postgresql', 'mysql', 'mssql', 'oracle', 'sqlite', 'snowflake'];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Connection Name</Label>
          <Input 
            value={form.name || ''}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="My SQL Connection"
          />
        </div>

        <div>
          <Label>Driver</Label>
          <Select 
          value={form.config.driver} 
          onValueChange={(value: SQLDriver) => updateForm({config:{driver: value}})}>
            <SelectTrigger>
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map(driver => (
                <SelectItem key={driver} value={driver}>
                  {driver.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.config.driver !== 'sqlite' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Host</Label>
            <Input 
              value={form.config.host || ''}
              onChange={(e) => updateForm({config:{host: e.target.value}})} 
              placeholder="localhost"
            />
          </div>

          <div>
            <Label>Port</Label>
            <Input 
              type="number"
              value={form.config.port || ''}
              onChange={(e) => updateForm({config:{port: parseInt(e.target.value)}})} 
              placeholder="5432"
            />
          </div>

          <div>
            <Label>Username</Label>
            <Input 
              value={form.config.user || ''}
              onChange={(e) => updateForm({config:{user: e.target.value}})} 
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input 
              type="password"
              value={form.config.password || ''}
              onChange={(e) => updateForm({config:{password: e.target.value}})} 
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Database</Label>
          <Input 
            value={form.config.database || ''}
            onChange={(e) => updateForm({config:{database: e.target.value}})} 
          />
        </div>

        {form.config.driver === 'sqlite' && (
          <div>
            <Label>File Path</Label>
            <Input 
              value={form.config.filePath || ''}
              onChange={(e) => updateForm({config:{filePath: e.target.value}})} 
              placeholder="/path/to/database.db"
            />
          </div>
        )}

        <div className="col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={advanced}
              onCheckedChange={setAdvanced}
            />
            <Label>Show Advanced Options</Label>
          </div>
        </div>
      </div>

      {advanced && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Timeout (seconds)</Label>
            <Input 
              type="number"
              value={form.config.timeout || ''}
              onChange={(e) => updateForm({config:{timeout: parseInt(e.target.value)}})} 
            />
          </div>

          <div className="flex items-center space-x-2 mt-8">
            <Switch
              checked={form.config.ssl || false}
              onCheckedChange={(checked) => updateForm({config:{ssl: checked}})} 
            />
            <Label>SSL</Label>
          </div>

          {form.config.driver === 'oracle' && (
            <>
              <div>
                <Label>Service Name</Label>
                <Input 
                  value={form.config.serviceName || ''}
                  onChange={(e) => updateForm({config:{serviceName: e.target.value}})} 
                />
              </div>
              <div>
                <Label>SID</Label>
                <Input 
                  value={form.config.sid || ''}
                  onChange={(e) => updateForm({config:{sid: e.target.value}})} 
                />
              </div>
            </>
          )}

          {form.config.driver === 'snowflake' && (
            <>
              <div>
                <Label>Warehouse</Label>
                <Input 
                  value={form.config.warehouse || ''}
                  onChange={(e) => updateForm({config:{warehouse: e.target.value}})} 
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input 
                  value={form.config.role || ''}
                  onChange={(e) => updateForm({config:{role: e.target.value}})} 
                />
              </div>
              <div>
                <Label>Account</Label>
                <Input 
                  value={form.config.account || ''}
                  onChange={(e) => updateForm({config:{account: e.target.value}})} 
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
