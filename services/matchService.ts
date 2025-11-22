import { supabase } from '../lib/supabaseClient';
import type { MatchState } from '../types';

export const saveMatchToSupabase = async (match: MatchState, userId: string) => {
    try {
        console.log('=== SAVING MATCH TO SUPABASE ===');
        console.log('Match ID:', match.id);
        console.log('User ID:', userId);
        console.log('Match Data:', {
            team1: match.team1.name,
            team2: match.team2.name,
            totalOvers: match.totalOvers,
            winner: match.matchOverMessage
        });

        // 1. Insert Match
        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert({
                user_id: userId,
                team1_name: match.team1.name,
                team2_name: match.team2.name,
                total_overs: match.totalOvers,
                winner_team: match.matchOverMessage.includes(match.team1.name) ? 'team1' :
                    match.matchOverMessage.includes(match.team2.name) ? 'team2' : 'tie',
                is_completed: true,
                final_score_team1: match.firstInningsResult?.score || 0,
                final_score_team2: match.score,
                final_wickets_team1: match.firstInningsResult?.wickets || 0,
                final_wickets_team2: match.wickets
            })
            .select()
            .single();

        if (matchError) {
            console.error('❌ MATCH INSERT ERROR:', matchError);
            console.error('Error details:', {
                message: matchError.message,
                details: matchError.details,
                hint: matchError.hint,
                code: matchError.code
            });
            throw matchError;
        }

        console.log('✅ Match inserted successfully:', matchData);
        const matchId = matchData.id;

        // Helper to save innings
        const saveInnings = async (inningsNum: number, teamKey: 'team1' | 'team2', score: number, wickets: number) => {
            const { data: inningsData, error: inningsError } = await supabase
                .from('innings')
                .insert({
                    match_id: matchId,
                    innings_number: inningsNum,
                    batting_team: teamKey,
                    total_runs: score,
                    total_wickets: wickets
                })
                .select()
                .single();

            if (inningsError) throw inningsError;
            return inningsData.id;
        };

        const innings1TeamKey = match.battingTeam === 'team1' ? 'team2' : 'team1';
        const innings2TeamKey = match.battingTeam;

        await saveInnings(1, innings1TeamKey, match.firstInningsResult?.score || 0, match.firstInningsResult?.wickets || 0);
        await saveInnings(2, innings2TeamKey, match.score, match.wickets);

        console.log('Match saved successfully!');
        return { success: true };

    } catch (error) {
        console.error('Error saving match to Supabase:', error);
        return { success: false, error };
    }
};

export const fetchMatchesFromSupabase = async (userId: string): Promise<MatchState[]> => {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('user_id', userId)
            .order('match_date', { ascending: false });

        if (error) throw error;

        // Map Supabase data to MatchState format (simplified for display)
        // Note: We are reconstructing a partial MatchState for history display.
        // Full reconstruction would require fetching innings/overs/balls which we aren't fully saving yet.
        return data.map((m: any) => ({
            id: m.id,
            completedAt: m.match_date,
            team1: { name: m.team1_name, players: [] }, // Players not saved in this simple schema
            team2: { name: m.team2_name, players: [] },
            totalOvers: m.total_overs,
            isMatchStarted: true,
            battingTeam: 'team2', // Arbitrary for summary
            bowlingTeam: 'team1',
            strikerId: null,
            nonStrikerId: null,
            bowlerId: null,
            batsmanStats: {},
            bowlerStats: {},
            score: m.final_score_team2,
            wickets: m.final_wickets_team2,
            currentOver: m.total_overs,
            currentBall: 0,
            currentOverHistory: [],
            allOversHistory: [],
            lastEvent: null,
            isMatchOver: true,
            matchOverMessage: m.winner_team === 'team1' ? `${m.team1_name} WON!` :
                m.winner_team === 'team2' ? `${m.team2_name} WON!` : 'MATCH TIED!',
            nextBatsmanIndex: 0,
            currentInnings: 2,
            firstInningsResult: {
                score: m.final_score_team1,
                wickets: m.final_wickets_team1
            }
        }));
    } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
    }
};
