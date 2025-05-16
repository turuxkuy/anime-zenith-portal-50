
// Edge function to ensure VIP requests and check for expired VIP memberships
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Run the SQL function to ensure the vip_requests table exists
    const { error: tableError } = await supabaseClient.rpc('ensure_vip_requests_table');
    if (tableError) {
      throw new Error(`Failed to ensure vip_requests table: ${tableError.message}`);
    }

    // Check for expired VIP memberships and update them
    const { data: expiredData, error: expiredError } = await supabaseClient.rpc('update_expired_vip_status');
    if (expiredError) {
      throw new Error(`Failed to check expired VIP status: ${expiredError.message}`);
    }

    return new Response(
      JSON.stringify({
        message: "VIP table and expired status check completed successfully",
        expiredUpdated: expiredData?.updated_count || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
