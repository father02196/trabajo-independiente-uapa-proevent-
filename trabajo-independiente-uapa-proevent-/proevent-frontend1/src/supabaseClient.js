// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus credenciales de Supabase
const supabaseUrl = "https://TU-PROJECT.supabase.co";
const supabaseKey = "TU_API_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);
