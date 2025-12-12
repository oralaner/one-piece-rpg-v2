import React, { useState, useEffect, useRef } from 'react';

const ChatTab = ({ messages, onSendMessage, channel, setChannel, userFaction, hasCrew, theme, userId }) => {
    const [input, setInput] = useState("");
    const endRef = useRef(null);

    // Scroll auto vers le bas
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const submit = (e) => {
        e.preventDefault();
        if(input.trim()) { onSendMessage(input, channel); setInput(""); }
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Onglets */}
            <div className="flex p-1 bg-black/30 rounded-lg shrink-0">
                <button onClick={() => setChannel('GENERAL')} className={`flex-1 py-2 rounded text-xs font-bold ${channel === 'GENERAL' ? theme.btnPrimary : 'text-slate-400'}`}>Général</button>
                <button onClick={() => setChannel('FACTION')} className={`flex-1 py-2 rounded text-xs font-bold ${channel === 'FACTION' ? theme.btnPrimary : 'text-slate-400'}`}>Faction</button>
                <button onClick={() => setChannel('EQUIPAGE')} className={`flex-1 py-2 rounded text-xs font-bold ${channel === 'EQUIPAGE' ? theme.btnPrimary : 'text-slate-400'}`}>Équipage</button>
            </div>

            {/* Zone Messages */}
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[300px]">
                {channel === 'EQUIPAGE' && !hasCrew ? (
                    <p className="text-center text-slate-500 my-auto">Rejoignez un équipage pour parler ici.</p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.joueur_id === userId;
                        let color = "text-slate-400";
                        if(msg.faction === 'Pirate') color = "text-red-400";
                        if(msg.faction === 'Marine') color = "text-cyan-400";
                        if(msg.faction === 'Révolutionnaire') color = "text-emerald-400";

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className={`text-[10px] font-bold ${color}`}>{msg.pseudo}</span>
                                <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] wrap-break-words ${isMe ? 'bg-slate-700 text-white' : 'bg-black/60 text-slate-200 border border-white/10'}`}>
                                    {msg.contenu}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={submit} className="flex gap-2 shrink-0">
                <input 
                    type="text" value={input} onChange={e => setInput(e.target.value)} 
                    placeholder="Message..." 
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none"
                    disabled={channel === 'EQUIPAGE' && !hasCrew}
                />
                <button type="submit" className={`px-4 rounded-lg font-bold ${theme.btnPrimary}`}>➤</button>
            </form>
        </div>
    );
};

export default ChatTab;