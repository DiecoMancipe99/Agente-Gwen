// ============================================
// AGENTE GWEN - CATÁLOGO: CONFIG SUPABASE
// ============================================

const SUPABASE_URL = 'https://dbvvdvmrnakpqggxpwrg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidnZkdm1ybmFrcHFnZ3hwd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Nzc2MjIsImV4cCI6MjA5MzE1MzYyMn0.Bpm6rDQcYrbvqLyM-DAQfumjlKtdVL2qVqPgt42OG68';

// Cliente Supabase simple para el catálogo (solo lectura pública)
const supabase = {
    from: (table) => ({
        select: (columns = '*') => ({
            then: (callback) => {
                fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(data => callback({ data, error: null }))
                .catch(err => callback({ data: null, error: err }));
            }
        })
    })
};

export { supabase };
