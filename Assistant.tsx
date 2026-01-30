import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AIAssistantChat } from '@/components/ai/AIAssistantChat';

export default function Assistant() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground">Your intelligent business companion</p>
        </div>
        <div className="h-[calc(100%-5rem)]">
          <AIAssistantChat />
        </div>
      </div>
    </DashboardLayout>
  );
}
