import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useInventory = (session, notify, setRewardModal) => {
    const queryClient = useQueryClient();
    
    // États UI (Modales)
    const [sellModalItem, setSellModalItem] = useState(null);
    const [marketSellItem, setMarketSellItem] = useState(null);
    const [marketPrice, setMarketPrice] = useState("");

    // --- 1. CHARGEMENT DES DONNÉES (CACHE) ---
    const { data: commerceData } = useQuery({
        queryKey: ['commerce'],
        queryFn: () => api.get('/game/commerce'),
        enabled: !!session?.user?.id,
        staleTime: 1000 * 60 * 5, 
        refetchOnWindowFocus: false
    });

    const boutiqueItems = commerceData?.boutique || [];
    const recettes = commerceData?.recettes || [];
    const marcheItems = commerceData?.marche || [];

    // --- 2. ACTIONS (MUTATIONS) ---
    
    const refreshAll = () => {
        queryClient.invalidateQueries(['playerData']);
        queryClient.invalidateQueries(['commerce']);
    };

    // A. ÉQUIPER / DÉSÉQUIPER
    const equipMutation = useMutation({
        mutationFn: (itemId) => api.post('/game/equip', { userId: session.user.id, inventaireId: itemId }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); },
        onError: (err) => notify(err.message, "error")
    });

    const unequipMutation = useMutation({
        mutationFn: (slot) => api.post('/game/unequip', { userId: session.user.id, slot }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); },
        onError: (err) => notify(err.message, "error")
    });

    // B. ACHETER (BOUTIQUE) - AVEC QUANTITÉ
    const buyShopMutation = useMutation({
        // 🔥 MODIFICATION ICI : On aligne les clés avec ce que le Contrôleur NestJS attend (itemId, quantity)
        mutationFn: ({ itemId, quantity }) => api.post('/game/buy', { 
            userId: session.user.id, 
            itemId: itemId, 
            quantity: quantity 
        }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); },
        onError: (err) => notify(err.message, "error")
    });

    // C. VENDRE (NPC) - AVEC QUANTITÉ
    const sellShopMutation = useMutation({
        mutationFn: ({ itemId, qte }) => api.post('/game/sell', { userId: session.user.id, inventaireId: itemId, quantite: qte }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); setSellModalItem(null); },
        onError: (err) => notify(err.message, "error")
    });

    // D. CRAFT
    const craftMutation = useMutation({
        mutationFn: (recetteId) => api.post('/game/craft', { userId: session.user.id, recetteId }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); },
        onError: (err) => notify(err.message, "error")
    });

    // E. MARCHÉ (VENDRE) - AVEC QUANTITÉ
    const marketSellMutation = useMutation({
        mutationFn: ({ itemId, qte, prix }) => api.post('/game/market/sell', { userId: session.user.id, inventaireId: itemId, quantite: qte, prix }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); setMarketSellItem(null); },
        onError: (err) => notify(err.message, "error")
    });

    // F. MARCHÉ (ACHETER)
    const marketBuyMutation = useMutation({
        mutationFn: (marketId) => api.post('/game/market/buy', { userId: session.user.id, marketId }),
        onSuccess: (res) => { notify(res.message, "success"); refreshAll(); },
        onError: (err) => notify(err.message, "error")
    });

    // G. UTILISER
    const utiliserObjet = async (item) => {
        // CAS 1 : COFFRE
        if (item.objets.categorie === "Coffre") { 
            try {
                const data = await api.post('/game/chest/open', { userId: session.user.id, inventaireId: item.id });
                
                setRewardModal({ 
                    success: true, 
                    type: "COFFRE", 
                    title: "Trésor Trouvé !",
                    berrys: data.gain_berrys || 0,
                    xp: data.gain_xp || 0,
                    itemsLooted: data.items || [], 
                    message: data.message
                });
                refreshAll();
            } catch(e) { 
                notify(e.message || "Erreur ouverture coffre", "error"); 
            }
        } 
        
        // CAS 2 : POTION / NOURRITURE / FRUIT
        else {
            try {
                const data = await api.post('/game/use', { 
                    userId: session.user.id, 
                    inventaireId: item.id 
                });
                
                notify(data.message, "success");
                refreshAll();
            } catch (e) {
                notify(e.message || "Erreur utilisation", "error");
            }
        }
    };

    const upgradeShipMutation = useMutation({
        mutationFn: () => api.post('/game/ship/upgrade', { userId: session.user.id }),
        onSuccess: (res) => { 
            notify(res.message, "success"); 
            refreshAll(); 
        },
        onError: (err) => notify(err.message || "Erreur construction", "error")
    });

    // --- 3. FONCTIONS D'INTERFACE ---

    const vendreObjetAction = (item, mode) => {
        if (mode === 'DIRECT') setSellModalItem(item);
        if (mode === 'HDV') { setMarketPrice(""); setMarketSellItem(item); }
    };

    // Alias pour la modale de vente directe
    const ouvrirModaleVente = (item) => setSellModalItem(item);

    return {
        // Data
        boutiqueItems, recettes, marcheItems,
        // Loaders
        chargerBoutique: () => {}, chargerRecettes: () => {}, chargerMarche: () => {}, 
        
        // Actions
        utiliserObjet,
        equiperObjet: (item) => equipMutation.mutate(item.id),
        desequiperObjet: (slot) => unequipMutation.mutate(slot),
        
        // 🔥 ACHAT BOUTIQUE CORRIGÉ : Envoie itemId et quantity
        acheterObjet: (item, amount = 1) => buyShopMutation.mutate({ itemId: item.id, quantity: amount }),
        
        crafterItem: (recette) => craftMutation.mutate(recette.id),
        ameliorerNavire: () => upgradeShipMutation.mutate(),
        
        // Marché (Acheter)
        acheterDuMarche: (annonce) => { if(confirm(`Acheter pour ${annonce.prix_unitaire} ฿ ?`)) marketBuyMutation.mutate(annonce.id); },
        
        // Marché (Mettre en vente avec quantité)
        confirmerMiseEnVente: (item = marketSellItem, qte = 1) => {
            const prix = parseInt(marketPrice);
            if (!item || isNaN(prix) || prix <= 0) return notify("Prix invalide", "error");
            marketSellMutation.mutate({ itemId: item.id, qte: qte, prix });
        },
        marketSellItem, marketPrice, setMarketPrice, annulerMiseEnVente: () => setMarketSellItem(null),

        // Vente Directe (NPC)
        vendreObjet: vendreObjetAction,
        sellModalItem, 
        annulerVente: () => setSellModalItem(null),
        
        // Vente Directe (Confirmer avec quantité)
        confirmerVente: (item = sellModalItem, qte = 1) => { 
            if (item) sellShopMutation.mutate({ itemId: item.id, qte: qte }); 
        },
        
        ouvrirModaleVente 
    };
};