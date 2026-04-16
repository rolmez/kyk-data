"use client";
import { useState } from "react";
import { Card, Button, Title } from "@tremor/react";

export default function AiAsistanPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "KYK AI Asistana hoş geldiniz! Claude Sonnet 4.5 kullanılıyor.\nÖrneğin 'Ege bölgesinde ciro nedir?' veya 'İzmir'de satış rakamları nasıl?' gibi analitik sorgulamalar yapabilirsiniz." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const outgoingMessage = input;
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
      
      // Geçici asistan mesajını listeye enjekte et
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
                // React statesini anlık olarak güncelle (Typewriter efekti)
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantResponse;
                  return updated;
                });
              }
            } catch {
              // Ignore incomplete JSON chunks or malformed strings
            }
          }
          boundary = buffer.indexOf('\n');
        }
      }
      
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Sunucu bağlantı hatası oluştu veya akış kesildi.";
        return updated;
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
                   <div className={`p-4 rounded-xl min-w-[30%] max-w-[80%] whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>
                      {m.content}
                   </div>
                </div>
             ))}
             {loading && actionStatus && (
               <div className="flex items-center space-x-2 text-emerald-600 animate-pulse text-sm pl-2 py-2">
                 <span>{actionStatus}</span>
               </div>
             )}
          </div>
          <div className="mt-4 p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-[#0b1120]">
             <input type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               placeholder="Tablolardan bilgi isteyin..."
               className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none dark:bg-slate-800 dark:text-white"
             />
             <Button onClick={sendMessage} loading={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Gönder</Button>
          </div>
       </Card>
    </div>
  );
}
