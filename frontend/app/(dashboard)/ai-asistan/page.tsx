"use client";
import { useState, useRef, useEffect } from "react";
import { Card, Button, Title } from "@tremor/react";

// Simple markdown renderer for chat bubbles
const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    
    // Headers
    if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-base mt-3 mb-1">{line.replace('### ', '')}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-lg mt-3 mb-1">{line.replace('## ', '')}</h3>;
    if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-xl mt-3 mb-1">{line.replace('# ', '')}</h2>;
    
    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2);
      return <div key={i} className="flex gap-2 ml-2 mb-1"><span>•</span><span>{renderInline(content)}</span></div>;
    }
    
    return <p key={i} className="mb-1">{renderInline(line)}</p>;
  });
};

// Inline bold/italic parser
const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const QUICK_PROMPTS = [
  "2024 yılında en çok düşen 3 ürün hangileri?",
  "İstanbul bölgesi toplam ciro analizi",
  "MegaTamir T108 hangi aylarda tercih ediliyor?",
  "Yapıştırıcılar kategorisinin yıllık performansı",
];

export default function AiAsistanPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "KYK AI Asistana hoş geldiniz! Claude Sonnet 4.5 kullanılıyor.\nÖrneğin 'Ege bölgesinde ciro nedir?' veya 'İzmir'de satış rakamları nasıl?' gibi analitik sorgulamalar yapabilirsiniz." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, actionStatus]);

  const sendMessage = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input;
    if (!messageToSend.trim() || loading) return;
    
    const outgoingMessage = messageToSend;
    const previousMessages = [...messages];
    
    const newMessages = [...messages, { role: "user", content: outgoingMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setActionStatus("Sunucuya bağlanılıyor...");

    try {
      const historyPayload = previousMessages
          .filter((_, idx) => idx !== 0) 
          .slice(-4); 

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: historyPayload, 
          new_message: outgoingMessage 
        })
      });

      if (!res.body) throw new Error("No readable stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      setMessages([...newMessages, { role: "assistant", content: "" }]);
      let assistantResponse = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          
          if (line) {
            try {
              const data = JSON.parse(line);
              if (data.type === "action") {
                setActionStatus(data.content);
              } else if (data.type === "text") {
                assistantResponse += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantResponse };
                  return [...updated];
                });
              }
            } catch {
              // Ignore incomplete JSON chunks
            }
          }
          boundary = buffer.indexOf('\n');
        }
      }
      
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: "Sunucu bağlantı hatası oluştu veya akış kesildi." };
        return [...updated];
      });
    } finally {
      setLoading(false);
      setActionStatus("");
    }
  };

  return (
    <div className="p-8 h-[calc(100vh)] flex flex-col space-y-4">
       <div>
         <Title className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-400">AI Satış Danışmanı</Title>
         <p className="text-slate-500 text-sm mt-1">Memory Devrede: Geçmiş sorularınızı anlayıp çapraz tablolarla yeni yanıtlar üretir.</p>
       </div>
       
       <Card className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
             {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`p-4 rounded-xl min-w-[30%] max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white shadow-md whitespace-pre-wrap' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>
                      {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                   </div>
                </div>
             ))}

             {/* Quick Prompts — ilk mesajdan sonra ve henüz kullanıcı bir şey sormamışsa */}
             {messages.length === 1 && !loading && (
               <div className="flex flex-wrap gap-2 pt-2">
                 {QUICK_PROMPTS.map((prompt, i) => (
                   <button
                     key={i}
                     onClick={() => sendMessage(prompt)}
                     className="px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                   >
                     {prompt}
                   </button>
                 ))}
               </div>
             )}

             {loading && actionStatus && (
               <div className="flex items-center space-x-2 text-emerald-600 animate-pulse text-sm pl-2 py-2">
                 <span>{actionStatus}</span>
               </div>
             )}
             <div ref={messagesEndRef} />
          </div>
          <div className="mt-4 p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-[#0b1120]">
             <input type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               placeholder="Tablolardan bilgi isteyin..."
               className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none dark:bg-slate-800 dark:text-white"
             />
             <Button onClick={() => sendMessage()} loading={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Gönder</Button>
          </div>
       </Card>
    </div>
  );
}
