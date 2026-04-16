"use client";
import { useState } from "react";
import { Card, Button, Title } from "@tremor/react";

export default function AiAsistanPage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "👋 KKY AI Satış Koçu'na hoş geldiniz! Hafızam (Claude 3.5 Sonnet) aktiftir.\nÖrneğin bana 'Ege bölgesinde ciro ne?' diye sorup ardından 'Peki ya İzmir'de rakam nasıl?' diyerek ardışık analitik sorgulamalar yapabilirsiniz." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Store current values
    const outgoingMessage = input;
    const previousMessages = [...messages];
    
    // Add user message to UI immediately
    const newMessages = [...messages, { role: "user", content: outgoingMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Sadece asistanin ilk standart mesajini (Index 0) tarihin disinda birak veya hepsini gonderilebilir, 
      // İlk mesajı API geçmişine göndermek gereksiz trafik yaratır. Son 4 diyalogumuzu alalım.
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
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: "assistant", content: "Sunucu bağlantı hatası oluştu." }]);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 h-[calc(100vh)] flex flex-col space-y-4">
       <div>
         <Title className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-400">AI Satış Danışmanı</Title>
         <p className="text-slate-500 text-sm mt-1">Sürekli Hafıza (Memory) Modeli Devrede: Geçmiş sorularınızı anlayıp çapraz tablolarla yeni yanıtlar üretir.</p>
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
             {loading && <div className="text-slate-400 animate-pulse text-sm pl-2">Geçmiş Hatırlanıyor & Şema Sentezleniyor...</div>}
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
