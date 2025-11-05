import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tyftqbmhrxyxnropxbmf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZnRxYm1ocnh5eG5yb3B4Ym1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzczNjYsImV4cCI6MjA3Nzk1MzM2Nn0.sUdqIoG-Z8uKAhVyV6COAjiF2rl63zRTC-DB_qPQbns";

export const supabase = createClient(supabaseUrl, supabaseKey);
