// Calcul du coût d'amélioration d'une stat
export const getStatCost = (val) => {
    if (val < 50) return 1;
    if (val < 100) return 2;
    return 3;
};

// Formatage du temps (ex: 1h 30m 12s)
export const formatChronoLong = (ms) => { 
    if (!ms || ms <= 0) return "PRÊT !";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s.toString().padStart(2, '0')}s`; 
};

export const formatTemps = (ms) => {
    if (ms <= 0) return "PRÊT";
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const pad = (num) => num.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
};

// Configuration des couleurs selon la rareté
export const getRareteConfig = (rarity) => {
    switch (rarity) {
        case 'Mythique':
            // Rouge (Dark)
            return { order: 5, border: 'border-red-600', text: 'text-red-400', shadow: 'shadow-red-500/30' }; // <-- order: 5
        case 'Légendaire':
            // Jaune/Or
            return { order: 4, border: 'border-yellow-500', text: 'text-yellow-400', shadow: 'shadow-yellow-500/30' }; // <-- order: 4
        case 'Épique':
            // Violet
            return { order: 3, border: 'border-purple-500', text: 'text-purple-400', shadow: 'shadow-purple-500/30' }; // <-- order: 3
        case 'Rare':
            // Bleu
            return { order: 2, border: 'border-blue-500', text: 'text-blue-400', shadow: 'shadow-blue-500/30' }; // <-- order: 2
        case 'Commun':
        default:
            // Gris
            return { order: 1, border: 'border-slate-500', text: 'text-slate-300', shadow: 'shadow-slate-600/30' }; // <-- order: 1
    }
};

// Calcul du rang PvP
export const getRankInfo = (points) => {
    const p = points || 0;
    if (p >= 1800) return { label: `Élite`, icon: "👑", color: "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]", fullLabel: `Élite (${p} LP)` };
    
    const tiers = ["Fer", "Bronze", "Argent", "Or", "Platine", "Diamant", "Élite"];
    const files = ["fer", "bronze", "argent", "or", "platine", "diamant", "elite"];
    const tierIndex = Math.floor(p / 300);
    const division = Math.floor((p % 300) / 100) + 1;
    const lp = p % 100;
    
    const tierName = tiers[Math.max(0, Math.min(tierIndex, 6))];
    const fileName = files[tierIndex];
    // Simplification des URLs pour l'exemple (tu pourras remettre les tiennes)
    // Ici on retourne surtout les couleurs et labels
    let color = "text-stone-400";
    if(tierIndex === 1) color = "text-orange-400";
    if(tierIndex === 2) color = "text-slate-300";
    if(tierIndex === 3) color = "text-yellow-400 drop-shadow-sm";
    if(tierIndex === 4) color = "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]";
    if(tierIndex === 5) color = "text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]";
    if(tierIndex === 6) color = "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]";

    return { 
        label: `${tierName} ${'I'.repeat(division)}`, 
        lp: lp,
        img: `/ranks/${fileName}.png`,        
        color: color,
        fullLabel: `${tierName} ${'I'.repeat(division)} - ${lp} LP`
    };
};

// --- FONCTION DE THÈME COMPLÈTE (DESIGN V1) ---
export const getFactionTheme = (factionName) => {
    // Normalisation pour éviter les bugs d'accents
    const f = factionName ? factionName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    if (f.includes('pirate')) {
        return {
            // PIRATE : Rouge Sang & Or (Agressif)
            appBg: "bg-gradient-to-br from-red-900 via-red-950 to-black",
            panel: "bg-black/40 border-red-500/30 backdrop-blur-xl", 
            textMain: "text-red-50",
            textDim: "text-red-200/60",
            highlight: "text-yellow-500 drop-shadow-sm",
            border: "border-red-200/50",
            borderLow: "border-red-900/30",
            // Dégradé bouton : Orange feu vers Rouge sang
            btnPrimary: "bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white shadow-lg shadow-red-900/50 border border-red-400/20",
            btnSecondary: "bg-red-950/40 text-red-200 border border-red-800 hover:bg-red-900/60",
            btnSmall: "bg-red-600 text-white hover:bg-red-500 shadow-md",
            barFill: "bg-gradient-to-r from-yellow-600 to-red-600",
            textGradient: "from-yellow-400 via-orange-500 to-red-600"
        };
    } 
    else if (f.includes('revo') || f.includes('revolutionnaire')) {
        return {
            // RÉVOLUTIONNAIRE : Vert Néon & Émeraude (Mystérieux)
            appBg: "bg-gradient-to-br from-emerald-900 via-green-950 to-black",
            panel: "bg-black/40 border-emerald-500/30 backdrop-blur-xl",
            textMain: "text-emerald-50",
            textDim: "text-emerald-200/60",
            highlight: "text-teal-300 drop-shadow-sm",
            border: "border-emerald-500/50",
            borderLow: "border-emerald-900/30",
            // Dégradé bouton : Vert clair vers Émeraude profond
            btnPrimary: "bg-gradient-to-r from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white shadow-lg shadow-emerald-900/50 border border-emerald-400/20",
            btnSecondary: "bg-emerald-950/40 text-emerald-200 border border-emerald-800 hover:bg-emerald-900/60",
            btnSmall: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md",
            barFill: "bg-gradient-to-r from-lime-500 to-emerald-600",
            textGradient: "from-lime-300 via-emerald-400 to-teal-600"
        };
    } 
    else if (f.includes('marine')) {
        // MARINE : Cyan & Bleu Abyssal (Tech/Moderne)
        return {
            appBg: "bg-gradient-to-br from-blue-900 via-slate-950 to-black",
            panel: "bg-slate-900/60 border-cyan-500/30 backdrop-blur-xl",
            textMain: "text-cyan-50",
            textDim: "text-cyan-200/60",
            highlight: "text-cyan-400 drop-shadow-sm",
            border: "border-cyan-500/50",
            borderLow: "border-blue-900/30",
            // Dégradé bouton : Cyan électrique vers Bleu roi
            btnPrimary: "bg-gradient-to-r from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 text-white shadow-lg shadow-blue-900/50 border border-cyan-400/20",
            btnSecondary: "bg-slate-800/60 text-cyan-200 border border-cyan-900 hover:bg-slate-700/80",
            btnSmall: "bg-cyan-600 text-white hover:bg-cyan-500 shadow-md",
            barFill: "bg-gradient-to-r from-cyan-400 to-blue-600",
            textGradient: "from-cyan-300 via-blue-400 to-indigo-500"
        };
    }
    
    // DÉFAUT (Neutre / Loading)
    return {
        appBg: "bg-gradient-to-br from-slate-900 via-slate-950 to-black",
        panel: "bg-slate-800/50 border-slate-700 backdrop-blur-md",
        textMain: "text-slate-200",
        textDim: "text-slate-400",
        highlight: "text-white",
        border: "border-slate-500/50",
        borderLow: "border-slate-800",
        btnPrimary: "bg-slate-600 text-white hover:bg-slate-500",
        btnSecondary: "bg-slate-800 text-slate-400",
        btnSmall: "bg-slate-600 text-white",
        barFill: "bg-slate-500",
        textGradient: "from-slate-200 to-slate-500"
    };
};

