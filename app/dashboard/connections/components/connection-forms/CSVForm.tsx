import { IConnection } from "@/app/lib/drizzle/schemas";
import { Input } from "@/app/ui/components/input";
import { Label } from "@/app/ui/components/label";

interface CSVFormProps {
  form: IConnection;
  setForm: (form: IConnection) => void;
}

export function CSVForm({ form, setForm }: CSVFormProps) {
  return (
    <div className="space-y-4">
        <div>
            <Label>Connection Name</Label>
            <Input 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="My CSV Connection"
            />
        </div>
        <div className="space-y-4">
        <div>
            <Label>File Upload</Label>
            <Input type="file" accept=".csv,.xlsx,.xls" />
        </div>
        <div>
            <Label>Refresh Interval (ms)</Label>
            {/* <Input 
                type="number"
                value={form.refreshInterval}
                onChange={(e) => setForm({...form, refreshInterval: parseInt(e.target.value)})}
            /> */}
            </div>
        </div>
    </div>
  );
}