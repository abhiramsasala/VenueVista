import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

Deno.serve(async (req) => {
  try {
    const { orderId, paymentId, signature } = await req.json();
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${orderId}|${paymentId}`));
    const expected = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (expected !== signature) return Response.json({ verified: false }, { status: 400 });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await admin.from('bookings').update({ status: 'confirmed', razorpay_payment_id: paymentId }).eq('razorpay_order_id', orderId);
    return Response.json({ verified: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
});
