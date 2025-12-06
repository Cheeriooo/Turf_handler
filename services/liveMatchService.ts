import { supabase } from '../lib/supabaseClient';
import type { MatchState } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveMatch {
    id: string;
    share_code: string;
    user_id: string;
    match_state: MatchState;
    created_at: string;
    updated_at: string;
}

// Generate a random 6-character share code
const generateShareCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I/L
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const startLiveMatch = async (
    userId: string,
    matchState: MatchState
): Promise<{ success: boolean; shareCode?: string; error?: any }> => {
    try {
        const shareCode = generateShareCode();

        const { error } = await supabase
            .from('live_matches')
            .insert({
                share_code: shareCode,
                user_id: userId,
                match_state: matchState
            });

        if (error) throw error;
        return { success: true, shareCode };
    } catch (error) {
        console.error('Error starting live match:', error);
        return { success: false, error };
    }
};

export const updateLiveMatch = async (
    shareCode: string,
    matchState: MatchState
): Promise<{ success: boolean; error?: any }> => {
    try {
        const { error } = await supabase
            .from('live_matches')
            .update({
                match_state: matchState,
                updated_at: new Date().toISOString()
            })
            .eq('share_code', shareCode);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating live match:', error);
        return { success: false, error };
    }
};

export const getLiveMatch = async (
    shareCode: string
): Promise<{ success: boolean; match?: LiveMatch; error?: any }> => {
    try {
        const { data, error } = await supabase
            .from('live_matches')
            .select('*')
            .eq('share_code', shareCode.toUpperCase())
            .single();

        if (error) throw error;
        return { success: true, match: data };
    } catch (error) {
        console.error('Error fetching live match:', error);
        return { success: false, error };
    }
};

export const subscribeLiveMatch = (
    shareCode: string,
    onUpdate: (matchState: MatchState) => void
): RealtimeChannel => {
    const channel = supabase
        .channel(`live_match_${shareCode}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'live_matches',
                filter: `share_code=eq.${shareCode.toUpperCase()}`
            },
            (payload) => {
                if (payload.new && (payload.new as LiveMatch).match_state) {
                    onUpdate((payload.new as LiveMatch).match_state);
                }
            }
        )
        .subscribe();

    return channel;
};

export const endLiveMatch = async (
    shareCode: string
): Promise<{ success: boolean; error?: any }> => {
    try {
        const { error } = await supabase
            .from('live_matches')
            .delete()
            .eq('share_code', shareCode);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error ending live match:', error);
        return { success: false, error };
    }
};

export const unsubscribeLiveMatch = (channel: RealtimeChannel) => {
    supabase.removeChannel(channel);
};
