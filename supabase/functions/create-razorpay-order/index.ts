import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const { bookingId, amount } = await req.json();
    if (!bookingId || !Number.isInteger(amount) || amount < 100) throw new Error('Invalid order');
    const key = Deno.env.get('RAZORPAY_KEY_ID')!;
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const response = await fetch('https://api.razorpay.com/v1/payment_links', { method: 'POST', headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, currency: 'INR', reference_id: bookingId, description: 'VenueVista booking deposit', notify: { sms: true, email: true }, reminder_enable: true }) });
    const order = await response.json();
    if (!response.ok) throw new Error(order?.error?.description || 'Razorpay error');
    await supabase.from('bookings').update({ razorpay_order_id: order.id, status: 'pending_payment' }).eq('id', bookingId).eq('customer_id', user.id);
    return Response.json({ orderId: order.id, checkoutUrl: order.short_url, amount: order.amount, currency: order.currency, key }, { headers: cors });
  } catch (error) { return Response.json({ error: error.message }, { status: 400, headers: cors }); }
});

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
