import AsyncStorage from '@react-native-async-storage/async-storage';
import { isBackendConfigured, supabase } from '../lib/supabase';

const DEMO_BOOKINGS = 'venuevista_demo_bookings';
const DEMO_ACCOUNTS = 'venuevista_demo_accounts';

async function getDemoAccounts() { return JSON.parse((await AsyncStorage.getItem(DEMO_ACCOUNTS)) || '[]'); }
async function saveDemoAccount(account) {
  const accounts = await getDemoAccounts();
  if (accounts.some(x => x.login === account.login)) throw new Error('An account already exists. Please sign in.');
  await AsyncStorage.setItem(DEMO_ACCOUNTS, JSON.stringify([...accounts, account]));
  return account;
}
async function demoLogin(login, password) {
  const account = (await getDemoAccounts()).find(x => x.login === login && x.password === password);
  if (!account) throw new Error('Account not found or password is incorrect. Create an account first.');
  return { ...account, password: undefined };
}

export async function signIn(email, password) {
  if (!isBackendConfigured) return { user: await demoLogin(email.toLowerCase(), password), demo: true };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  return { user: { ...data.user, role: profile?.role || 'customer', name: profile?.full_name } };
}

export async function signUp(name, email, password) {
  if (!isBackendConfigured) { const user = await saveDemoAccount({ id:`email-${Date.now()}`,login:email.toLowerCase(),email:email.toLowerCase(),password,name,role:'customer' }); return { user:{...user,password:undefined},demo:true }; }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) throw error;
  return { user: data.user, needsVerification: !data.session };
}

export async function signInWithPhone(phone, password) {
  if (!isBackendConfigured) return { user: await demoLogin(`+91${phone}`, password), demo: true };
  const { data, error } = await supabase.auth.signInWithPassword({ phone: `+91${phone}`, password });
  if (error) throw error;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  return { user: { ...data.user, name: profile?.full_name, role: profile?.role || 'customer' } };
}

export async function signUpWithPhone(name, phone, password) {
  if (!isBackendConfigured) { const user = await saveDemoAccount({id:`phone-${Date.now()}`,login:`+91${phone}`,phone:`+91${phone}`,password,name,role:'customer'}); return {user:{...user,password:undefined},demo:true}; }
  const { data, error } = await supabase.auth.signUp({ phone: `+91${phone}`, password, options: { data: { full_name: name } } });
  if (error) throw error;
  return { user: { ...data.user, name, role: 'customer' }, needsVerification: !data.session };
}

export async function signOut() { if (supabase) await supabase.auth.signOut(); }

export async function createBooking(booking) {
  if (!isBackendConfigured) {
    const current = JSON.parse((await AsyncStorage.getItem(DEMO_BOOKINGS)) || '[]');
    const saved = { ...booking, id: `VV-${Date.now().toString().slice(-6)}`, status: 'enquiry_sent', created_at: new Date().toISOString() };
    await AsyncStorage.setItem(DEMO_BOOKINGS, JSON.stringify([saved, ...current]));
    return saved;
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('bookings').insert({ ...booking, customer_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function getBookings() {
  if (!isBackendConfigured) return JSON.parse((await AsyncStorage.getItem(DEMO_BOOKINGS)) || '[]');
  const { data, error } = await supabase.from('bookings').select('*, venues(name, location, cover_image)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function cancelBooking(bookingId) {
  if (!isBackendConfigured) {
    const current = JSON.parse((await AsyncStorage.getItem(DEMO_BOOKINGS)) || '[]');
    const updated = current.map(item => item.id === bookingId ? { ...item, status: 'cancelled', cancelled_at: new Date().toISOString() } : item);
    await AsyncStorage.setItem(DEMO_BOOKINGS, JSON.stringify(updated));
    return updated.find(item => item.id === bookingId);
  }
  const { data, error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId).select().single();
  if (error) throw error;
  return data;
}

export async function getOwnerStats() {
  if (!isBackendConfigured) return { enquiries: 18, confirmed: 7, revenue: 485000, occupancy: 72 };
  const { data, error } = await supabase.rpc('owner_dashboard_stats');
  if (error) throw error;
  return data;
}

export async function requestPaymentOrder(bookingId, amount) {
  const base = process.env.EXPO_PUBLIC_PAYMENT_API_URL;
  if (!base || base.includes('YOUR_PROJECT')) return { demo: true, orderId: `order_demo_${Date.now()}`, amount };
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${base}/create-razorpay-order`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ bookingId, amount }) });
  if (!response.ok) throw new Error('Unable to create payment order');
  return response.json();
}
