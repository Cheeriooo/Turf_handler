import { supabase } from '../lib/supabaseClient';

export interface SavedTeam {
    id: string;
    user_id: string;
    team_name: string;
    player_names: string[];
    created_at: string;
}

export const getSavedTeams = async (userId: string): Promise<SavedTeam[]> => {
    try {
        const { data, error } = await supabase
            .from('saved_teams')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching saved teams:', error);
        return [];
    }
};

export const saveTeam = async (
    userId: string,
    teamName: string,
    playerNames: string[]
): Promise<{ success: boolean; team?: SavedTeam; error?: any }> => {
    try {
        const { data, error } = await supabase
            .from('saved_teams')
            .insert({
                user_id: userId,
                team_name: teamName,
                player_names: playerNames.filter(p => p.trim())
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, team: data };
    } catch (error) {
        console.error('Error saving team:', error);
        return { success: false, error };
    }
};

export const updateTeam = async (
    teamId: string,
    teamName: string,
    playerNames: string[]
): Promise<{ success: boolean; error?: any }> => {
    try {
        const { error } = await supabase
            .from('saved_teams')
            .update({
                team_name: teamName,
                player_names: playerNames.filter(p => p.trim())
            })
            .eq('id', teamId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating team:', error);
        return { success: false, error };
    }
};

export const deleteTeam = async (
    teamId: string
): Promise<{ success: boolean; error?: any }> => {
    try {
        const { error } = await supabase
            .from('saved_teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting team:', error);
        return { success: false, error };
    }
};
