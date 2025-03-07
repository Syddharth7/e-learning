import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aopayvqfysxnaqxivojn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcGF5dnFmeXN4bmFxeGl2b2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODgwMzYsImV4cCI6MjA1NjY2NDAzNn0.OnZR90GhphlhyUjeQEAyvb_ur2at-xDPuLS2ExGarEM';
export const supabase = createClient(supabaseUrl, supabaseKey);