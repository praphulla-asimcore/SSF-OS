'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/intelligence/knowledge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      });
      if (!res.ok) {
        setMessages([...newMsgs, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let partialRead = '';

      setMessages([...newMsgs, { role: 'assistant', content: '' }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content ?? '';
              assistantContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: assistantContent };
                return copy;
              });
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><MessageSquare className="w-6 h-6 text-[#D8FF36]" /> Sunday Knowledge AI</h1>
        <p className="text-white/40 text-sm mt-1">Ask questions grounded in your production knowledge library</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-16 h-16 text-[#D8FF36]/30 mx-auto mb-4" />
              <p className="text-white/30 text-lg">Ask me anything about your productions</p>
              <p className="text-white/20 text-sm mt-2">I’ll search the knowledge library and cite my sources</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#D8FF36]/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-[#D8FF36]" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-xl p-4 text-sm ${
              msg.role === 'user' ? 'bg-[#009AFF]/20 text-white' : 'glass text-white/80'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content || (streaming && i === messages.length - 1 ? '' : '')}</p>
              {streaming && i === messages.length - 1 && !msg.content && <Loader2 className="w-4 h-4 animate-spin text-[#D8FF36]" />}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#009AFF]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#009AFF]" />
              </div>
            )}
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="mt-4 flex gap-3">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about projects, vendors, SOPs, lessons learned…" disabled={streaming} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D8FF36]/50 disabled:opacity-50" />
        <button type="submit" disabled={streaming || !input.trim()} className="px-4 py-3 rounded-lg bg-[#D8FF36] text-black font-medium hover:bg-[#c5eb30] disabled:opacity-50 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
