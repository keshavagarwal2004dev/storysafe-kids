import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SettingsPage = () => (
  <div className="max-w-2xl">
    <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
    <p className="text-muted-foreground mb-8">Manage your account and organization</p>

    <Card className="border-0 shadow-card">
      <CardHeader><CardTitle className="text-lg">Organization Details</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Organization Name</Label>
          <Input defaultValue="Child Safety Foundation" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Contact Email</Label>
          <Input defaultValue="admin@csf.org" className="rounded-xl" />
        </div>
        <Button>Save Changes</Button>
      </CardContent>
    </Card>
  </div>
);

export default SettingsPage;
