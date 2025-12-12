import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api'; 

export const useSkills = (session, notify, joueur, refreshPlayer) => {
    const queryClient = useQueryClient();

    // --- 1. RÉCUPÉRATION DES DONNÉES ---
    const { data: skillsData, refetch: chargerMesCompetences } = useQuery({
        queryKey: ['skillsData', session?.user?.id],
        queryFn: () => api.get(`/game/skills/${session.user.id}`),
        enabled: !!session?.user?.id,
        staleTime: 1000 * 60 * 5, 
    });

    // 🛑 CORRECTION ICI :
    // Le backend renvoie { allSkills: [...], mySkillIds: [1, 5, 8] }
    // On utilise directement ces données.
    const competences = skillsData?.allSkills || [];
    const mesCompetences = skillsData?.mySkillIds || []; // Liste d'IDs simples [1, 2]

    // --- 2. ACTIONS ---
    const buySkillMutation = useMutation({
        mutationFn: (skillId) => api.post('/game/skill/buy', { userId: session.user.id, skillId }),
        onSuccess: (res) => {
            notify(res.message, "success");
            queryClient.invalidateQueries(['playerData']); 
            queryClient.invalidateQueries(['skillsData']); // Force le rechargement de la liste
            if (refreshPlayer) refreshPlayer();
        },
        onError: (err) => notify(err.message || "Erreur d'achat", "error")
    });

    const equipSkillMutation = useMutation({
        mutationFn: (skillId) => api.post('/game/skill/equip', { userId: session.user.id, skillId }),
        onSuccess: (res) => {
            notify(res.message, "success");
            queryClient.invalidateQueries(['playerData']);
            if (refreshPlayer) refreshPlayer();
        },
        onError: (err) => notify(err.message || "Erreur d'équipement", "error")
    });

    return {
        competences,      
        mesCompetences,   // Contient maintenant [1, 5, 8...]
        
        acheterCompetence: (id) => buySkillMutation.mutate(id),
        equiperCompetence: (id) => equipSkillMutation.mutate(id),
        
        chargerMesCompetences,
        eveillerHaki: () => {} 
    };
};