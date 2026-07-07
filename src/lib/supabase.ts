import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://cdejldgjconrqbwoyjll.supabase.co';
// // const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZWpsZGdqY29ucnFid295amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTA0NjIsImV4cCI6MjA5MzEyNjQ2Mn0.y8enYvhgm1q90ewQXAA05WfmYBa5FckTr4yDE2p8ius';

// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('Supabase URL or Anon Key is missing in environment variables (.env)');
// }

export const supabase = createClient('https://cdejldgjconrqbwoyjll.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZWpsZGdqY29ucnFid295amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTA0NjIsImV4cCI6MjA5MzEyNjQ2Mn0.y8enYvhgm1q90ewQXAA05WfmYBa5FckTr4yDE2p8ius');
