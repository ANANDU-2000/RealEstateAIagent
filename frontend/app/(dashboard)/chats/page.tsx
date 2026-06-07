import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function ChatsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Live Chats</h1>
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="When buyers message your WhatsApp number, conversations will appear here."
      />
    </div>
  );
}
