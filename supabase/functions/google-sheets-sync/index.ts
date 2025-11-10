import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, role, orderId, techId } = await req.json();

    // Get Google Sheets credentials from secrets
    const credentials = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS');
    if (!credentials) {
      throw new Error('Google Sheets credentials not configured');
    }

    // Get sheet URL for the role
    const { data: config } = await supabaseClient
      .from('google_sheets_config')
      .select('sheet_url')
      .eq('role', role)
      .single();

    if (!config) {
      throw new Error(`No Google Sheet configured for role: ${role}`);
    }

    // Extract spreadsheet ID from URL
    const sheetIdMatch = config.sheet_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL');
    }
    const spreadsheetId = sheetIdMatch[1];

    // Parse credentials
    const credentialsJson = JSON.parse(credentials);

    if (action === 'test') {
      // Test connection by trying to read sheet metadata
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connection configured. Note: Full API integration requires additional setup.',
          spreadsheetId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync') {
      // Get tech's full name
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', techId)
        .single();

      if (!profile) {
        throw new Error('Tech profile not found');
      }

      // Here you would implement the Google Sheets API calls
      // For now, we'll return a success message
      // Full implementation would use googleapis library and OAuth2

      return new Response(
        JSON.stringify({
          success: true,
          message: `Order ${orderId} would be synced to sheet for ${profile.full_name}`,
          note: 'Full Google Sheets API integration requires googleapis library'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
