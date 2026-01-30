import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { AIAssistantChat } from '@/components/ai/AIAssistantChat';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen p-6 transition-all duration-300">
        {children}
      </main>

      {/* Floating AI Button */}
      <Button
        onClick={() => setShowAI(!showAI)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          showAI 
            ? "bg-destructive hover:bg-destructive/90" 
            : "gradient-primary hover:opacity-90 shadow-glow"
        )}
      >
        {showAI ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>

      {/* AI Chat Panel */}
      {showAI && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] animate-slide-up z-50">
          <AIAssistantChat onClose={() => setShowAI(false)} />
        </div>
      )}
    </div>
  );
};
