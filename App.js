import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, Platform, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { cancelBooking, createBooking, getBookings, getOwnerStats, requestPaymentOrder, signIn, signInWithPhone, signOut, signUp, signUpWithPhone } from './services/backend';
import { isBackendConfigured } from './lib/supabase';

const { width } = Dimensions.get('window');
const plum = '#56142F';
const gold = '#E69A3B';
const ink = '#21181C';

function openContact(url) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
    return;
  }
  Linking.openURL(url).catch(() => Alert.alert('App unavailable', 'Install or configure the required phone, email, or WhatsApp app and try again.'));
}

const halls = [
  {
    id: '1', name: 'Aaranya Grand Palace', place: 'Gandipet, Hyderabad', district: 'Hyderabad',
    price: '₹1.85L', rating: '4.9', guests: '1,200', type: 'Wedding', tag: 'Most loved',
    image: require('./assets/grand-mandap.png'),
    about: 'A regal celebration space where modern comfort meets the craft of Telangana. A column-free ballroom, carved stone details and a luminous floral mandap make every angle memorable.',
  },
  {
    id: '2', name: 'Deccan Courtyard', place: 'Shamirpet, Medchal', district: 'Medchal',
    price: '₹1.25L', rating: '4.8', guests: '800', type: 'Wedding', tag: 'Outdoor',
    image: { uri: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85' },
    about: 'An open-sky venue with sandstone courtyards, garden lawns and flexible celebration zones for intimate and grand events.',
  },
  {
    id: '3', name: 'The Nizam Pavilion', place: 'Banjara Hills, Hyderabad', district: 'Hyderabad',
    price: '₹2.40L', rating: '4.9', guests: '1,500', type: 'Reception', tag: 'Luxury',
    image: { uri: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85' },
    about: 'A dramatic city venue with grand chandeliers, a sweeping stage and carefully curated hospitality for milestone celebrations.',
  },
  {
    id: '4', name: 'Kakatiya Convention', place: 'Hanamkonda, Warangal', district: 'Warangal',
    price: '₹95K', rating: '4.7', guests: '1,000', type: 'Corporate', tag: 'Great value',
    image: { uri: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85' },
    about: 'A versatile convention hall inspired by Kakatiya geometry, with modern audio-visual facilities and generous guest areas.',
  },
  {
    id: '5', name: 'Manair Celebration House', place: 'Mukarampura, Karimnagar', district: 'Karimnagar',
    price: '₹78K', rating: '4.7', guests: '700', type: 'Wedding', tag: 'Family pick',
    image: { uri: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85' },
    about: 'A warm, contemporary celebration house close to central Karimnagar, designed for weddings, engagements and family gatherings.',
  },
  {
    id: '6', name: 'Indur Royal Gardens', place: 'Vinayak Nagar, Nizamabad', district: 'Nizamabad',
    price: '₹88K', rating: '4.6', guests: '900', type: 'Reception', tag: 'Garden venue',
    image: { uri: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85' },
    about: 'Landscaped lawns and an elegant covered pavilion create an easy indoor-outdoor flow for memorable celebrations in Nizamabad.',
  },
  {
    id: '7', name: 'Munneru Grand Arena', place: 'Wyra Road, Khammam', district: 'Khammam',
    price: '₹92K', rating: '4.8', guests: '1,100', type: 'Corporate', tag: 'New opening',
    image: { uri: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85' },
    about: 'A spacious new-generation arena with a large stage, premium lighting and adaptable layouts for social and business events.',
  },
  {
    id: '8', name: 'Neelagiri Heritage Hall', place: 'NGO Colony, Nalgonda', district: 'Nalgonda',
    price: '₹68K', rating: '4.6', guests: '650', type: 'Wedding', tag: 'Heritage',
    image: { uri: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=85' },
    about: 'Traditional detailing, a welcoming banquet floor and practical guest facilities make this a favourite for Nalgonda families.',
  },
];

const categories = ['All', 'Wedding', 'Reception', 'Corporate'];
const locations = [
  ['Hyderabad', '82 venues', 'business-outline'], ['Warangal', '24 venues', 'flower-outline'],
  ['Karimnagar', '18 venues', 'sparkles-outline'], ['Nizamabad', '16 venues', 'leaf-outline'],
  ['Khammam', '14 venues', 'sunny-outline'], ['Nalgonda', '12 venues', 'home-outline'],
];
const ownersByDistrict = {
  Hyderabad: { name:'Ramesh Reddy', phone:'9876543210', email:'ramesh@venuevista.in' },
  Medchal: { name:'Sandeep Goud', phone:'9849012345', email:'sandeep@venuevista.in' },
  Warangal: { name:'Kiran Rao', phone:'9988776655', email:'kiran@venuevista.in' },
  Karimnagar: { name:'Anil Kumar', phone:'9701234567', email:'anil@venuevista.in' },
  Nizamabad: { name:'Sravani Reddy', phone:'9866123456', email:'sravani@venuevista.in' },
  Khammam: { name:'Vamsi Krishna', phone:'9848123456', email:'vamsi@venuevista.in' },
  Nalgonda: { name:'Madhavi Devi', phone:'9704567890', email:'madhavi@venuevista.in' },
};
const amenities = [
  ['snow-outline', 'Central AC'], ['car-outline', 'Valet parking'], ['restaurant-outline', 'In-house catering'],
  ['videocam-outline', '4K event setup'], ['bed-outline', 'Bridal suites'], ['flash-outline', 'Power backup'],
];

function Pill({ icon, text, dark }) {
  return <View style={[styles.pill, dark && styles.pillDark]}><Ionicons name={icon} size={14} color={dark ? '#fff' : plum} /><Text style={[styles.pillText, dark && { color: '#fff' }]}>{text}</Text></View>;
}

function Home({ onOpen, liked, setLiked }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad');
  const [filterOpen, setFilterOpen] = useState(false);
  const [capacity, setCapacity] = useState(0);
  const visible = useMemo(() => halls.filter(h => (category === 'All' || h.type === category) && Number(h.guests.replace(',','')) >= capacity && `${h.name} ${h.place}`.toLowerCase().includes(query.toLowerCase())), [category, query, capacity]);

  return <View style={{ flex: 1 }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
      <View style={styles.top}>
        <View>
          <Text style={styles.eyebrow}>YOUR LOCATION</Text>
          <View style={styles.location}><Ionicons name="location" size={18} color={gold} /><Text style={styles.locationText}>{selectedLocation}, Telangana</Text><Ionicons name="chevron-down" size={15} color="#fff" /></View>
        </View>
        <Pressable onPress={() => Alert.alert('Notifications','You’re all caught up. New booking updates will appear here.')} style={styles.bell}><Ionicons name="notifications-outline" size={22} color="#fff" /><View style={styles.dot} /></Pressable>
      </View>

      <View style={styles.hero}>
        <Image source={require('./assets/grand-mandap.png')} style={styles.heroImage} />
        <LinearGradient colors={['rgba(31,7,18,.06)', 'rgba(39,5,20,.86)']} style={StyleSheet.absoluteFill} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>CELEBRATE BEAUTIFULLY</Text>
          <Text style={styles.heroTitle}>A venue as special{`\n`}as your story.</Text>
          <Text style={styles.heroSub}>Handpicked function halls across Telangana</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.search}><Ionicons name="search" size={20} color="#8A7C82" /><TextInput value={query} onChangeText={setQuery} placeholder="Search halls or locations" placeholderTextColor="#998D92" style={styles.input} /><Pressable onPress={()=>setFilterOpen(true)} style={styles.filter}><Ionicons name="options" size={18} color="#fff" /></Pressable></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
      </ScrollView>

      <View style={styles.sectionHead}><View><Text style={styles.overline}>ACROSS THE STATE</Text><Text style={styles.sectionTitle}>Choose a location</Text></View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locationCards}>
        {locations.map(([city,count,icon]) => <Pressable key={city} onPress={() => {setQuery(city);setSelectedLocation(city);}} style={[styles.locationCard, selectedLocation === city && styles.locationCardActive]}><View style={[styles.locationIcon, selectedLocation === city && {backgroundColor:'#fff'}]}><Ionicons name={icon} size={21} color={selectedLocation === city ? plum : gold}/></View><Text style={[styles.locationCity, selectedLocation === city && {color:'#fff'}]}>{city}</Text><Text style={[styles.locationCount, selectedLocation === city && {color:'#EACED9'}]}>{count}</Text></Pressable>)}
      </ScrollView>

      <View style={styles.sectionHead}><View><Text style={styles.overline}>CURATED FOR YOU</Text><Text style={styles.sectionTitle}>Signature venues</Text></View><Pressable onPress={()=>{setQuery('');setCategory('All');setCapacity(0);}}><Text style={styles.seeAll}>See all</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * .77 + 14} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
        {visible.slice(0, 3).map(hall => <Pressable key={hall.id} onPress={() => onOpen(hall)} style={styles.featureCard}>
          <Image source={hall.image} style={styles.featureImage} />
          <LinearGradient colors={['transparent', 'rgba(23,7,14,.92)']} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => setLiked(v => v.includes(hall.id) ? v.filter(x => x !== hall.id) : [...v, hall.id])} style={styles.heart}><Ionicons name={liked.includes(hall.id) ? 'heart' : 'heart-outline'} size={19} color={liked.includes(hall.id) ? '#D94D64' : ink} /></Pressable>
          <View style={styles.cardTag}><Text style={styles.cardTagText}>{hall.tag}</Text></View>
          <View style={styles.featureCopy}><Text style={styles.featureName}>{hall.name}</Text><View style={styles.row}><Ionicons name="location-outline" size={14} color="#EADDE3" /><Text style={styles.featurePlace}>{hall.place}</Text></View><View style={styles.cardBottom}><Text style={styles.price}>{hall.price}<Text style={styles.per}> / day</Text></Text><Text style={styles.rating}>★ {hall.rating}</Text></View></View>
        </Pressable>)}
      </ScrollView>

      <View style={styles.sectionHead}><View><Text style={styles.overline}>EXPLORE TELANGANA</Text><Text style={styles.sectionTitle}>Venues near you</Text></View></View>
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        {visible.map(hall => <Pressable key={hall.id} onPress={() => onOpen(hall)} style={styles.listCard}><Image source={hall.image} style={styles.listImage} /><View style={styles.listBody}><Text style={styles.listType}>{hall.type.toUpperCase()}</Text><Text style={styles.listName} numberOfLines={2}>{hall.name}</Text><Text style={styles.listPlace}><Ionicons name="location-outline" size={12} /> {hall.place}</Text><View style={styles.listBottom}><Text style={styles.listPrice}>{hall.price}<Text style={styles.muted}> / day</Text></Text><Text style={styles.muted}>★ {hall.rating} · {hall.guests}</Text></View></View></Pressable>)}
        {!visible.length && <View style={styles.empty}><Ionicons name="search-outline" size={32} color={gold} /><Text style={styles.emptyText}>No venues match your search</Text></View>}
      </View>
    </ScrollView>
    <Modal transparent visible={filterOpen} animationType="fade"><View style={styles.modalShade}><View style={styles.filterSheet}><View style={styles.filterHead}><Text style={styles.filterTitle}>Filter venues</Text><Pressable onPress={()=>setFilterOpen(false)}><Ionicons name="close" size={24}/></Pressable></View><Text style={styles.filterLabel}>Minimum guest capacity</Text><View style={styles.capacityRow}>{[0,500,1000,1500].map(x=><Pressable key={x} onPress={()=>setCapacity(x)} style={[styles.capacityChoice,capacity===x&&styles.capacityChoiceActive]}><Text style={[styles.capacityText,capacity===x&&{color:'#fff'}]}>{x?`${x}+`:'Any'}</Text></Pressable>)}</View><Pressable onPress={()=>setFilterOpen(false)} style={[styles.loginButton,{marginTop:22}]}><Text style={styles.loginButtonText}>Show {visible.length} venues</Text></Pressable></View></View></Modal>
  </View>;
}

function Detail({ hall, onClose, onBook, liked, setLiked }) {
  const [tab, setTab] = useState('Architecture');
  const saved = liked.includes(hall.id);
  const owner = ownersByDistrict[hall.district] || ownersByDistrict.Hyderabad;
  return <Modal animationType="slide" visible presentationStyle="fullScreen">
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.detailHero}>
          <Image source={hall.image} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(20,4,12,.45)', 'transparent', 'rgba(20,4,12,.55)']} style={StyleSheet.absoluteFill} />
          <Pressable onPress={onClose} style={[styles.roundButton, { left: 20 }]}><Ionicons name="arrow-back" size={22} color={ink} /></Pressable>
          <Pressable onPress={() => setLiked(v=>saved?v.filter(id=>id!==hall.id):[...v,hall.id])} style={[styles.roundButton, { right: 20 }]}><Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#C63F5A' : ink} /></Pressable>
          <View style={styles.photoCount}><Ionicons name="images-outline" color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}> 18 photos</Text></View>
        </View>
        <View style={styles.detailBody}>
          <Text style={styles.detailType}>{hall.type.toUpperCase()} · {hall.tag.toUpperCase()}</Text>
          <Text style={styles.detailName}>{hall.name}</Text>
          <View style={[styles.row, { marginTop: 8 }]}><Text style={styles.detailRating}>★ {hall.rating}</Text><Text style={styles.review}>  328 reviews</Text></View>
          <View style={styles.infoPills}><Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hall.name + ' ' + hall.place)}`)}><Pill icon="navigate-outline" text={hall.place} /></Pressable><Pill icon="people-outline" text={`Up to ${hall.guests}`} /></View>
          <View style={styles.pricePanel}><View><Text style={styles.muted}>Starting from</Text><Text style={styles.bigPrice}>{hall.price}<Text style={styles.perDark}> / day</Text></Text></View><View style={styles.instant}><Ionicons name="flash" color="#187A55" /><Text style={styles.instantText}> Instant enquiry</Text></View></View>

          <Text style={styles.contentTitle}>A space with a story</Text><Text style={styles.about}>{hall.about}</Text>
          <Text style={styles.contentTitle}>See the venue your way</Text>
          <View style={styles.tabs}>{['Architecture', 'Interiors', 'Décor looks'].map(x => <Pressable onPress={() => setTab(x)} key={x} style={[styles.tab, tab === x && styles.tabActive]}><Text style={[styles.tabText, tab === x && styles.tabTextActive]}>{x}</Text></Pressable>)}</View>
          <View style={styles.gallery}>
            <Image source={hall.image} style={styles.galleryBig} />
            <View style={{ flex: 1, gap: 8 }}><Image source={{ uri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=85' }} style={styles.gallerySmall} /><Image source={{ uri: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=800&q=85' }} style={styles.gallerySmall} /></View>
          </View>
          <Pressable onPress={()=>Alert.alert(`${tab} view`,'The complete venue gallery contains stage, seating, entrance and floor-layout views.')} style={styles.archNote}><Ionicons name="cube-outline" size={24} color={gold} /><View style={{ flex: 1 }}><Text style={styles.archTitle}>{tab} view</Text><Text style={styles.archText}>Explore the layout, stage sightlines, seating flow and design details before you visit.</Text></View><Ionicons name="arrow-forward" color={plum} size={20} /></Pressable>
          <Text style={styles.contentTitle}>Everything you need</Text>
          <View style={styles.amenities}>{amenities.map(([icon, label]) => <View style={styles.amenity} key={label}><View style={styles.amenityIcon}><Ionicons name={icon} size={18} color={plum} /></View><Text style={styles.amenityText}>{label}</Text></View>)}</View>
          <Text style={styles.contentTitle}>Contact the venue owner</Text>
          <View style={styles.ownerContact}><View style={styles.ownerAvatar}><Text style={styles.ownerInitial}>{owner.name[0]}</Text></View><View style={{flex:1}}><Text style={styles.ownerRole}>VENUE MANAGER</Text><Text style={styles.ownerName}>{owner.name}</Text><Text style={styles.ownerPhone}>+91 {owner.phone}</Text></View></View>
          <View style={styles.contactActions}><Pressable onPress={()=>openContact(`tel:+91${owner.phone}`)} style={styles.contactButton}><Ionicons name="call" size={18} color={plum}/><Text style={styles.contactButtonText}>Call</Text></Pressable><Pressable onPress={()=>openContact(`https://api.whatsapp.com/send?phone=91${owner.phone}&text=${encodeURIComponent(`Hello, I am interested in ${hall.name} on VenueVista.`)}`)} style={styles.contactButton}><Ionicons name="logo-whatsapp" size={19} color="#187A55"/><Text style={styles.contactButtonText}>WhatsApp</Text></Pressable><Pressable onPress={()=>openContact(`mailto:${owner.email}?subject=${encodeURIComponent(`Enquiry for ${hall.name}`)}&body=${encodeURIComponent(`Hello ${owner.name}, I am interested in booking ${hall.name}. Please share availability and details.`)}`)} style={styles.contactButton}><Ionicons name="mail" size={18} color={gold}/><Text style={styles.contactButtonText}>Email</Text></Pressable></View>
        </View>
      </ScrollView>
      <View style={styles.bookBar}><View><Text style={styles.barPrice}>{hall.price}</Text><Text style={styles.barSub}>per day + taxes</Text></View><Pressable onPress={onBook} style={styles.bookButton}><Text style={styles.bookButtonText}>Check availability</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable></View>
    </SafeAreaView>
  </Modal>;
}

function Booking({ hall, onClose, onBooked }) {
  const [date, setDate] = useState('24 Aug');
  const [slot, setSlot] = useState('Full day');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('');
  const dates = ['22 Aug', '23 Aug', '24 Aug', '25 Aug'];
  if (done) return <Modal visible animationType="slide"><SafeAreaView style={styles.success}><View style={styles.successIcon}><Ionicons name="checkmark" size={44} color="#fff" /></View><Text style={styles.successTitle}>Your celebration starts here</Text><Text style={styles.successText}>We’ve sent your enquiry to {hall.name}. The venue manager will contact you shortly.</Text><View style={styles.confirmCard}><Text style={styles.confirmLabel}>VENUE ENQUIRY · {reference}</Text><Text style={styles.confirmName}>{hall.name}</Text><Text style={styles.confirmMeta}>{date}  ·  {slot}  ·  Hyderabad</Text></View><Pressable onPress={onClose} style={[styles.bookButton, { width: '100%', justifyContent: 'center' }]}><Text style={styles.bookButtonText}>Back to venues</Text></Pressable></SafeAreaView></Modal>;
  return <Modal visible animationType="slide" presentationStyle="pageSheet"><SafeAreaView style={styles.screen}>
    <View style={styles.bookingHead}><Pressable onPress={onClose}><Ionicons name="close" size={26} /></Pressable><Text style={styles.bookingTitle}>Plan your visit</Text><View style={{ width: 26 }} /></View>
    <ScrollView contentContainerStyle={styles.bookingBody}>
      <View style={styles.bookingVenue}><Image source={hall.image} style={styles.bookingImage} /><View style={{ flex: 1 }}><Text style={styles.bookingVenueName}>{hall.name}</Text><Text style={styles.muted}>{hall.place}</Text></View></View>
      <Text style={styles.step}>01  CHOOSE A DATE</Text><Text style={styles.bookingQuestion}>When are you celebrating?</Text>
      <View style={styles.choiceRow}>{dates.map(x => <Pressable onPress={() => setDate(x)} key={x} style={[styles.dateChoice, date === x && styles.selectedChoice]}><Text style={[styles.choiceDay, date === x && { color: '#fff' }]}>{x.split(' ')[0]}</Text><Text style={[styles.choiceMonth, date === x && { color: '#F3DCE5' }]}>AUG</Text></Pressable>)}</View>
      <Text style={styles.step}>02  SELECT A SLOT</Text><Text style={styles.bookingQuestion}>How long do you need?</Text>
      {['Morning · 7 AM – 2 PM', 'Evening · 4 PM – 11 PM', 'Full day'].map(x => <Pressable onPress={() => setSlot(x)} key={x} style={[styles.slot, slot === x && styles.slotSelected]}><Ionicons name={slot === x ? 'radio-button-on' : 'radio-button-off'} size={20} color={slot === x ? plum : '#A99BA1'} /><Text style={styles.slotText}>{x}</Text></Pressable>)}
      <Text style={styles.step}>03  YOUR EVENT</Text><Text style={styles.bookingQuestion}>Tell us a little more</Text>
      <View style={styles.form}><TextInput value={name} onChangeText={setName} placeholder="Your name" style={styles.formInput} /><TextInput value={phone} onChangeText={setPhone} placeholder="Mobile number" keyboardType="phone-pad" style={styles.formInput} /><TextInput value={guests} onChangeText={setGuests} placeholder="Expected guests" keyboardType="number-pad" style={styles.formInput} /></View>
      <View style={styles.promise}><Ionicons name="shield-checkmark-outline" size={22} color="#187A55" /><Text style={styles.promiseText}>No payment now. Your details are shared only with this venue.</Text></View>
    </ScrollView>
    <View style={styles.bookBar}><View><Text style={styles.barPrice}>₹5,000</Text><Text style={styles.barSub}>refundable booking deposit</Text></View><Pressable disabled={loading} onPress={async () => { if (!name || phone.length < 10) return Alert.alert('Add your details', 'Please enter your name and a valid mobile number.'); try { setLoading(true); const booking = await createBooking({ venue_id: hall.id, venue_name: hall.name, event_date: `2026-08-${date.split(' ')[0]}`, slot, guest_count: Number(guests || 0), customer_name: name, customer_phone: phone, amount: 500000 }); setReference(booking.id); const payment = await requestPaymentOrder(booking.id, 500000); if (payment.checkoutUrl) await Linking.openURL(payment.checkoutUrl); setDone(true); onBooked?.(); } catch (e) { Alert.alert('Could not complete booking', e.message); } finally { setLoading(false); } }} style={styles.bookButton}>{loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.bookButtonText}>Reserve & pay</Text><Ionicons name="arrow-forward" color="#fff" size={18} /></>}</Pressable></View>
  </SafeAreaView></Modal>;
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [method, setMethod] = useState('phone');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const showError = (message, title = mode === 'signup' ? 'Could not create account' : 'Login not valid') => setNotice({type:'error',title,message});
  const clearForm = () => { setName(''); setEmail(''); setPhone(''); setPassword(''); setConfirmPassword(''); setNotice(null); };
  const changeMode = next => { clearForm(); setMode(next); };
  const changeMethod = next => { clearForm(); setMethod(next); };
  const registrationValid = () => { if (!name.trim()) { setNotice({type:'error',title:'Name required',message:'Enter your name to create an account.'}); return false; } if (password !== confirmPassword) { setNotice({type:'error',title:'Passwords do not match',message:'Enter the same password in both fields.'}); return false; } return true; };
  const finishRegistration = () => { setMode('signin'); setName(''); setEmail(''); setPhone(''); setPassword(''); setConfirmPassword(''); setNotice({type:'success',title:'Account created successfully',message:'Now enter your registered details and password to sign in.'}); };
  const submit = async () => { setNotice(null); if (!email.includes('@') || password.length < 6) return showError('Enter a valid email and a password of at least 6 characters.'); if (mode === 'signup' && !registrationValid()) return; try { setLoading(true); if (mode === 'signin') { const result = await signIn(email, password); onAuthenticated(result.user); } else { const result = await signUp(name, email, password); if (result.needsVerification) setNotice({type:'success',title:'Account created',message:'Check your email to verify the account, then sign in.'}); else finishRegistration(); } } catch (e) { setNotice({type:'error',title:mode === 'signin' ? 'Login not valid' : 'Could not create account',message:e.message}); } finally { setLoading(false); } };
  const submitPhone = async () => { setNotice(null); if (!/^\d{10}$/.test(phone)) return showError('Enter a valid 10-digit Indian mobile number.'); if (password.length < 6) return showError('Password must contain at least 6 characters.'); if (mode === 'signup' && !registrationValid()) return; try { setLoading(true); if (mode === 'signin') { const result = await signInWithPhone(phone,password); onAuthenticated(result.user); } else { const result = await signUpWithPhone(name,phone,password); if (result.needsVerification) setNotice({type:'success',title:'Account created',message:'Verify your phone, then sign in with your password.'}); else finishRegistration(); } } catch(e) { setNotice({type:'error',title:mode === 'signin' ? 'Login not valid' : 'Could not create account',message:e.message}); } finally { setLoading(false); } };
  return <ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
    <View style={styles.loginVisual}>
      <Image source={require('./assets/grand-mandap.png')} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(27,4,14,.2)','rgba(52,7,25,.94)']} style={StyleSheet.absoluteFill}/>
      <View style={styles.loginBrand}><Image source={require('./assets/venuevista-logo.png')} style={styles.loginLogo}/><View><Text style={styles.brandName}>VenueVista</Text><Text style={styles.brandLine}>CELEBRATE BEAUTIFULLY</Text></View></View>
      <View style={styles.loginHeroCopy}><Text style={styles.loginHeroTitle}>Find a place worthy{`\n`}of your moments.</Text><Text style={styles.loginHeroSub}>Exceptional function halls across Telangana, all in one beautiful place.</Text></View>
    </View>
    <View style={styles.loginSheet}>
      <View style={styles.sheetHandle}/><View style={styles.accountTabs}><Pressable onPress={()=>changeMode('signin')} style={[styles.accountTab,mode==='signin'&&styles.accountTabActive]}><Text style={[styles.accountTabText,mode==='signin'&&styles.accountTabTextActive]}>Sign in</Text></Pressable><Pressable onPress={()=>changeMode('signup')} style={[styles.accountTab,mode==='signup'&&styles.accountTabActive]}><Text style={[styles.accountTabText,mode==='signup'&&styles.accountTabTextActive]}>Create account</Text></Pressable></View><Text style={styles.loginTitle}>{mode === 'signin' ? 'Welcome back' : 'Join VenueVista'}</Text><Text style={styles.loginSub}>{mode === 'signin' ? 'Sign in using the account and password you created.' : 'Create an account to save venues and manage celebrations.'}</Text>
      {notice && <View style={[styles.authNotice,notice.type==='success'?styles.authNoticeSuccess:styles.authNoticeError]}><Ionicons name={notice.type==='success'?'checkmark-circle':'alert-circle'} size={22} color={notice.type==='success'?'#267255':'#B23750'}/><View style={{flex:1}}><Text style={[styles.authNoticeTitle,{color:notice.type==='success'?'#185E43':'#9C2940'}]}>{notice.title}</Text><Text style={styles.authNoticeMessage}>{notice.message}</Text></View></View>}
      <View style={styles.orRow}><View style={styles.orLine}/><Text style={styles.orText}>{mode === 'signin' ? 'SIGN IN TO YOUR ACCOUNT' : 'CREATE YOUR ACCOUNT'}</Text><View style={styles.orLine}/></View>
      <View style={styles.methodTabs}><Pressable onPress={() => changeMethod('phone')} style={[styles.methodTab,method==='phone'&&styles.methodTabActive]}><Ionicons name="phone-portrait-outline" size={16} color={method==='phone'?'#fff':plum}/><Text style={[styles.methodText,method==='phone'&&{color:'#fff'}]}>Phone</Text></Pressable><Pressable onPress={() => changeMethod('email')} style={[styles.methodTab,method==='email'&&styles.methodTabActive]}><Ionicons name="mail-outline" size={16} color={method==='email'?'#fff':plum}/><Text style={[styles.methodText,method==='email'&&{color:'#fff'}]}>Email</Text></Pressable></View>
      {mode === 'signup' && <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#9B8C92" style={styles.authInput} />}
      {method === 'email' ? <View style={styles.loginInput}><Ionicons name="mail-outline" size={19} color="#8D7B82"/><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor="#9B8C92" style={styles.loginInputText}/></View> : <View style={styles.loginInput}><Text style={styles.countryCode}>+91</Text><View style={styles.phoneDivider}/><TextInput value={phone} onChangeText={x=>setPhone(x.replace(/\D/g,'').slice(0,10))} keyboardType="phone-pad" placeholder="10-digit mobile number" placeholderTextColor="#9B8C92" style={styles.loginInputText}/></View>}
      <View style={styles.loginInput}><Ionicons name="lock-closed-outline" size={19} color="#8D7B82"/><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder={mode==='signup'?'Create password':'Password'} placeholderTextColor="#9B8C92" style={styles.loginInputText}/></View>
      {mode === 'signup' && <View style={styles.loginInput}><Ionicons name="shield-checkmark-outline" size={19} color="#8D7B82"/><TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Confirm password" placeholderTextColor="#9B8C92" style={styles.loginInputText}/></View>}
      <Pressable disabled={loading} onPress={method==='phone'?submitPhone:submit} style={styles.loginButton}>{loading ? <ActivityIndicator color="#fff"/> : <><Text style={styles.loginButtonText}>{mode === 'signin' ? 'Sign in' : 'Create my account'}</Text><Ionicons name="arrow-forward" size={19} color="#fff"/></>}</Pressable>
      <Pressable onPress={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}><Text style={styles.authSwitch}>{mode === 'signin' ? 'No account yet?  Create one now' : 'Account already created?  Sign in'}</Text></Pressable>
    </View>
  </ScrollView>;
}

function BookingHistory({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const load = () => getBookings().then(setItems).catch(() => {});
  useEffect(() => { load(); }, [refreshKey]);
  const cancel = async id => { try { await cancelBooking(id); setConfirmCancel(null); load(); } catch(e) { Alert.alert('Unable to cancel',e.message); } };
  return <ScrollView contentContainerStyle={styles.subPage}><Text style={styles.pageEyebrow}>MY EVENTS</Text><Text style={styles.pageTitle}>Bookings</Text>{items.length ? items.map(x => <View key={x.id} style={styles.historyCard}><View style={styles.historyTop}><View style={styles.historyIcon}><Ionicons name="calendar" size={20} color={plum}/></View><View style={{flex:1}}><Text style={styles.historyName}>{x.venue_name || x.venues?.name || 'Venue booking'}</Text><Text style={styles.historyMeta}>{x.event_date} · {x.slot}</Text></View><Text style={[styles.status,x.status==='cancelled'&&styles.statusCancelled]}>{String(x.status).replace('_',' ')}</Text></View><Text style={styles.historyRef}>Reference {x.id}</Text>{x.status !== 'cancelled' && (confirmCancel === x.id ? <View style={styles.cancelConfirm}><Text style={styles.cancelQuestion}>Cancel this booking?</Text><View style={styles.cancelActions}><Pressable onPress={()=>setConfirmCancel(null)} style={styles.keepButton}><Text style={styles.keepButtonText}>Keep booking</Text></Pressable><Pressable onPress={()=>cancel(x.id)} style={styles.confirmCancelButton}><Text style={styles.confirmCancelText}>Yes, cancel</Text></Pressable></View></View> : <Pressable onPress={()=>setConfirmCancel(x.id)} style={styles.cancelButton}><Ionicons name="close-circle-outline" size={17} color="#B23750"/><Text style={styles.cancelButtonText}>Cancel booking</Text></Pressable>)}</View>) : <View style={styles.emptyLarge}><Ionicons name="calendar-outline" size={44} color={gold}/><Text style={styles.emptyTitle}>No bookings yet</Text><Text style={styles.placeholderText}>Your enquiries, payments and confirmed events will appear here.</Text></View>}</ScrollView>;
}

function OwnerDashboard({ user }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { getOwnerStats().then(setStats).catch(() => {}); }, []);
  const cards = stats ? [['chatbubbles','Enquiries',stats.enquiries],['checkmark-circle','Confirmed',stats.confirmed],['wallet','Revenue',`₹${Math.round(stats.revenue/1000)}K`],['pie-chart','Occupancy',`${stats.occupancy}%`]] : [];
  return <ScrollView contentContainerStyle={styles.subPage}><Text style={styles.pageEyebrow}>VENUE PARTNER</Text><Text style={styles.pageTitle}>Good morning, {user.name || 'Owner'}</Text><Text style={styles.ownerSub}>Here’s how your venue is performing.</Text><View style={styles.statGrid}>{cards.map(([icon,label,value]) => <View style={styles.statCard} key={label}><Ionicons name={icon} size={22} color={gold}/><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View><Text style={styles.contentTitle}>Quick actions</Text>{[['add-circle-outline','Add a new venue'],['images-outline','Update photos & architecture'],['calendar-outline','Manage availability'],['pricetag-outline','Update pricing']].map(([icon,label]) => <Pressable key={label} onPress={() => Alert.alert(label,'This form is ready to connect to your Supabase venue table.')} style={styles.ownerAction}><Ionicons name={icon} size={22} color={plum}/><Text style={styles.ownerActionText}>{label}</Text><Ionicons name="chevron-forward" color="#9B8B91"/></Pressable>)}</ScrollView>;
}

function Profile({ user, onAuthenticated, onLogout }) {
  if (!user) return <AuthScreen onAuthenticated={onAuthenticated}/>;
  if (user.role === 'owner' || user.role === 'admin') return <OwnerDashboard user={user}/>;
  return <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || user.email || 'V')[0].toUpperCase()}</Text></View><Text style={styles.profileName}>{user.name || 'VenueVista member'}</Text><Text style={styles.profileEmail}>{user.email}</Text><View style={styles.backendBadge}><View style={[styles.backendDot,{backgroundColor:isBackendConfigured?'#3D946E':gold}]}/><Text style={styles.backendText}>{isBackendConfigured ? 'Connected to Supabase' : 'Demo mode'}</Text></View><Pressable onPress={onLogout} style={styles.logout}><Ionicons name="log-out-outline" color="#B23750" size={20}/><Text style={styles.logoutText}>Sign out</Text></Pressable></View>;
}

function SplashScreen() {
  return <View style={styles.splash}>
    <Image source={require('./assets/grand-mandap.png')} style={StyleSheet.absoluteFill}/>
    <LinearGradient colors={['rgba(38,4,17,.75)','rgba(70,10,36,.96)']} style={StyleSheet.absoluteFill}/>
    <View style={styles.splashGlow}/>
    <Image source={require('./assets/venuevista-logo.png')} style={styles.splashLogo}/>
    <Text style={styles.splashName}>VenueVista</Text>
    <Text style={styles.splashLine}>YOUR MOMENT · YOUR VENUE</Text>
    <View style={styles.splashLoader}><View style={styles.splashLoaderFill}/></View>
  </View>;
}

function SavedVenues({ liked, setLiked, onOpen }) {
  const saved = halls.filter(h=>liked.includes(h.id));
  return <ScrollView contentContainerStyle={styles.subPage}><Text style={styles.pageEyebrow}>YOUR SHORTLIST</Text><Text style={styles.pageTitle}>Saved venues</Text>{saved.length ? saved.map(hall=><Pressable key={hall.id} onPress={()=>onOpen(hall)} style={styles.listCard}><Image source={hall.image} style={styles.listImage}/><View style={styles.listBody}><Text style={styles.listType}>{hall.district.toUpperCase()}</Text><Text style={styles.listName}>{hall.name}</Text><Text style={styles.listPlace}>{hall.place}</Text><View style={styles.listBottom}><Text style={styles.listPrice}>{hall.price}</Text><Pressable onPress={()=>setLiked(v=>v.filter(id=>id!==hall.id))}><Ionicons name="heart" size={21} color="#C63F5A"/></Pressable></View></View></Pressable>) : <View style={styles.emptyLarge}><Ionicons name="heart-outline" size={44} color={gold}/><Text style={styles.emptyTitle}>No saved venues</Text><Text style={styles.placeholderText}>Tap the heart on a venue card to add it here.</Text></View>}</ScrollView>;
}

function AppShell() {
  const [detail, setDetail] = useState(null);
  const [booking, setBooking] = useState(false);
  const [nav, setNav] = useState('Discover');
  const [user, setUser] = useState(null);
  const [bookingRefresh, setBookingRefresh] = useState(0);
  const [liked, setLiked] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 1800); return () => clearTimeout(timer); }, []);
  if (showSplash) return <SplashScreen/>;
  if (!user) return <SafeAreaView style={styles.screen}><AuthScreen onAuthenticated={setUser}/></SafeAreaView>;
  return <SafeAreaView style={styles.screen} edges={['top']}>
    {nav === 'Discover' ? <Home onOpen={setDetail} liked={liked} setLiked={setLiked}/> : nav === 'Bookings' ? <BookingHistory refreshKey={bookingRefresh}/> : nav === 'Profile' ? <Profile user={user} onAuthenticated={setUser} onLogout={async()=>{await signOut();setUser(null);}}/> : <SavedVenues liked={liked} setLiked={setLiked} onOpen={setDetail}/>}
    <View style={styles.nav}>{[['compass','Discover'],['heart','Saved'],['calendar','Bookings'],['person','Profile']].map(([icon,label]) => <Pressable key={label} onPress={() => setNav(label)} style={styles.navItem}><View style={nav === label && styles.navActive}><Ionicons name={nav === label ? icon : `${icon}-outline`} size={21} color={nav === label ? plum : '#97898F'} /></View><Text style={[styles.navText, nav === label && { color: plum }]}>{label}</Text></Pressable>)}</View>
    {detail && <Detail hall={detail} liked={liked} setLiked={setLiked} onClose={() => setDetail(null)} onBook={() => setBooking(true)} />}
    {detail && booking && <Booking hall={detail} onBooked={() => setBookingRefresh(x=>x+1)} onClose={() => { setBooking(false); setDetail(null); }} />}
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><StatusBar barStyle="light-content" backgroundColor={plum} /><AppShell /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#FBF7F3'}, top:{height:94,backgroundColor:plum,paddingHorizontal:20,paddingTop:14,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}, eyebrow:{fontSize:10,letterSpacing:1.6,color:'#DDB9C9',fontWeight:'800'}, location:{flexDirection:'row',alignItems:'center',gap:6,marginTop:7},locationText:{color:'#fff',fontSize:17,fontWeight:'800'},bell:{width:42,height:42,borderRadius:21,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center'},dot:{width:7,height:7,borderRadius:5,backgroundColor:gold,position:'absolute',right:10,top:9,borderWidth:1,borderColor:plum},
  hero:{height:390,marginTop:-1,overflow:'hidden'},heroImage:{width:'100%',height:'100%'},heroCopy:{position:'absolute',left:20,right:20,bottom:62},heroKicker:{color:'#F6C982',fontSize:11,fontWeight:'900',letterSpacing:2.2},heroTitle:{color:'#fff',fontSize:37,lineHeight:42,fontWeight:'800',letterSpacing:-1.2,marginTop:8},heroSub:{color:'#F1E8EB',fontSize:14,marginTop:9},searchWrap:{marginTop:-35,paddingHorizontal:20},search:{height:64,borderRadius:20,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',paddingLeft:18,paddingRight:8,shadowColor:'#3B1926',shadowOpacity:.13,shadowRadius:18,shadowOffset:{width:0,height:7},elevation:6},input:{flex:1,fontSize:15,paddingHorizontal:12,color:ink},filter:{height:48,width:48,borderRadius:15,backgroundColor:plum,alignItems:'center',justifyContent:'center'},chips:{paddingHorizontal:20,paddingVertical:20,gap:10},chip:{paddingHorizontal:20,paddingVertical:11,borderRadius:22,backgroundColor:'#fff',borderWidth:1,borderColor:'#E8DEE1'},chipActive:{backgroundColor:plum,borderColor:plum},chipText:{fontWeight:'700',color:'#74676D'},chipTextActive:{color:'#fff'},
  sectionHead:{paddingHorizontal:20,marginTop:6,marginBottom:15,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},overline:{fontSize:10,color:'#A76C37',letterSpacing:1.6,fontWeight:'900'},sectionTitle:{fontSize:25,color:ink,fontWeight:'800',marginTop:3,letterSpacing:-.5},seeAll:{color:plum,fontWeight:'800'},featureCard:{width:width*.77,height:365,borderRadius:26,overflow:'hidden',backgroundColor:'#ddd'},featureImage:{width:'100%',height:'100%'},featureCopy:{position:'absolute',left:18,right:18,bottom:18},heart:{position:'absolute',right:14,top:14,width:42,height:42,borderRadius:21,backgroundColor:'rgba(255,255,255,.92)',alignItems:'center',justifyContent:'center'},cardTag:{position:'absolute',left:14,top:14,paddingHorizontal:11,paddingVertical:7,backgroundColor:gold,borderRadius:14},cardTagText:{fontSize:11,fontWeight:'900',color:'#4B2911'},featureName:{fontSize:23,lineHeight:27,color:'#fff',fontWeight:'800'},row:{flexDirection:'row',alignItems:'center'},featurePlace:{fontSize:13,color:'#EADDE3',marginLeft:3,marginTop:4},cardBottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:12,paddingTop:12,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.25)'},price:{fontSize:20,fontWeight:'900',color:'#fff'},per:{fontSize:12,fontWeight:'500'},rating:{color:'#fff',fontWeight:'800'},
  locationCards:{paddingHorizontal:20,paddingBottom:23,gap:10},locationCard:{width:132,height:128,borderRadius:20,backgroundColor:'#fff',padding:14,borderWidth:1,borderColor:'#ECE2DE'},locationCardActive:{backgroundColor:plum,borderColor:plum},locationIcon:{width:39,height:39,borderRadius:13,backgroundColor:'#F7EADF',alignItems:'center',justifyContent:'center'},locationCity:{fontSize:15,fontWeight:'900',color:ink,marginTop:12},locationCount:{fontSize:10.5,color:'#918289',marginTop:3},
  listCard:{height:140,borderRadius:20,backgroundColor:'#fff',overflow:'hidden',flexDirection:'row',shadowColor:'#4E2333',shadowOpacity:.06,shadowRadius:12,elevation:2},listImage:{width:132,height:'100%'},listBody:{flex:1,padding:13},listType:{fontSize:9,color:'#A76C37',fontWeight:'900',letterSpacing:1},listName:{fontSize:16,lineHeight:19,fontWeight:'800',color:ink,marginTop:4},listPlace:{fontSize:11,color:'#877A80',marginTop:4},listBottom:{marginTop:'auto',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},listPrice:{fontWeight:'900',color:plum,fontSize:15},muted:{fontSize:11,color:'#8C7F85'},empty:{height:150,alignItems:'center',justifyContent:'center',gap:10},emptyText:{color:'#887980'},
  detailHero:{height:410,backgroundColor:'#ddd'},roundButton:{position:'absolute',top:18,width:44,height:44,borderRadius:22,backgroundColor:'rgba(255,255,255,.92)',alignItems:'center',justifyContent:'center'},photoCount:{position:'absolute',right:20,bottom:22,backgroundColor:'rgba(31,17,23,.65)',borderRadius:18,paddingHorizontal:13,paddingVertical:8,flexDirection:'row'},detailBody:{marginTop:-24,borderTopLeftRadius:28,borderTopRightRadius:28,backgroundColor:'#FBF7F3',paddingHorizontal:20,paddingTop:27},detailType:{fontSize:10,color:'#A76C37',fontWeight:'900',letterSpacing:1.5},detailName:{fontSize:31,lineHeight:35,fontWeight:'800',color:ink,marginTop:7,letterSpacing:-.8},detailRating:{color:'#A76C37',fontWeight:'900'},review:{color:'#94878C'},infoPills:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:17},pill:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:11,paddingVertical:8,borderRadius:15,backgroundColor:'#F2E8E2'},pillDark:{backgroundColor:plum},pillText:{fontSize:12,color:'#57494F',fontWeight:'700'},pricePanel:{backgroundColor:'#fff',borderRadius:20,padding:17,marginTop:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#EEE4E0'},bigPrice:{fontSize:24,fontWeight:'900',color:plum,marginTop:2},perDark:{fontSize:12,color:'#76686E',fontWeight:'500'},instant:{flexDirection:'row',backgroundColor:'#E5F4ED',paddingHorizontal:10,paddingVertical:7,borderRadius:14},instantText:{fontSize:11,color:'#187A55',fontWeight:'800'},contentTitle:{fontSize:20,fontWeight:'800',color:ink,marginTop:26,marginBottom:10},about:{fontSize:14.5,lineHeight:23,color:'#6F6268'},tabs:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:'#E4D9D5',marginBottom:12},tab:{paddingVertical:11,marginRight:21},tabActive:{borderBottomWidth:3,borderBottomColor:gold},tabText:{fontSize:12,color:'#96888D',fontWeight:'700'},tabTextActive:{color:plum},gallery:{height:260,flexDirection:'row',gap:8},galleryBig:{flex:1.45,borderRadius:17},gallerySmall:{flex:1,width:'100%',borderRadius:14},archNote:{marginTop:12,backgroundColor:'#F3E7DF',borderRadius:18,padding:15,flexDirection:'row',alignItems:'center',gap:12},archTitle:{fontWeight:'900',color:ink},archText:{fontSize:11.5,lineHeight:17,color:'#766970',marginTop:2},amenities:{flexDirection:'row',flexWrap:'wrap',gap:9},amenity:{width:'31%',backgroundColor:'#fff',borderRadius:14,padding:11,alignItems:'center',minHeight:88},amenityIcon:{width:34,height:34,borderRadius:17,backgroundColor:'#F4E9E3',alignItems:'center',justifyContent:'center'},amenityText:{fontSize:10.5,textAlign:'center',color:'#63545B',fontWeight:'700',marginTop:7},ownerContact:{backgroundColor:'#fff',borderRadius:18,padding:15,flexDirection:'row',alignItems:'center',gap:12},ownerAvatar:{width:50,height:50,borderRadius:16,backgroundColor:plum,alignItems:'center',justifyContent:'center'},ownerInitial:{fontSize:22,fontWeight:'900',color:'#fff'},ownerRole:{fontSize:8,fontWeight:'900',letterSpacing:1.2,color:'#A76C37'},ownerName:{fontSize:16,fontWeight:'900',color:ink,marginTop:2},ownerPhone:{fontSize:11,color:'#85777D',marginTop:2},contactActions:{flexDirection:'row',gap:8,marginTop:9,marginBottom:10},contactButton:{flex:1,height:47,borderRadius:14,backgroundColor:'#fff',borderWidth:1,borderColor:'#E6DAD6',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},contactButtonText:{fontSize:10.5,fontWeight:'900',color:'#56474E'},
  bookBar:{position:'absolute',left:0,right:0,bottom:0,backgroundColor:'#fff',paddingHorizontal:20,paddingVertical:13,borderTopWidth:1,borderTopColor:'#ECE2DE',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},barPrice:{fontSize:19,fontWeight:'900',color:plum},barSub:{fontSize:10,color:'#8B7F84'},bookButton:{height:52,borderRadius:17,backgroundColor:plum,paddingHorizontal:20,flexDirection:'row',gap:9,alignItems:'center'},bookButtonText:{color:'#fff',fontSize:14,fontWeight:'900'},
  bookingHead:{height:62,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#E9DEDB'},bookingTitle:{fontSize:18,fontWeight:'900'},bookingBody:{padding:20,paddingBottom:120},bookingVenue:{backgroundColor:'#fff',borderRadius:18,padding:10,flexDirection:'row',alignItems:'center',gap:12},bookingImage:{width:76,height:68,borderRadius:13},bookingVenueName:{fontSize:15,fontWeight:'900',color:ink,marginBottom:5},step:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:'#A76C37',marginTop:29},bookingQuestion:{fontSize:21,fontWeight:'800',marginTop:5,marginBottom:15},choiceRow:{flexDirection:'row',gap:8},dateChoice:{flex:1,backgroundColor:'#fff',borderRadius:15,paddingVertical:13,alignItems:'center',borderWidth:1,borderColor:'#E7DBD8'},selectedChoice:{backgroundColor:plum,borderColor:plum},choiceDay:{fontSize:16,fontWeight:'900',color:ink},choiceMonth:{fontSize:9,color:'#918389',fontWeight:'800',marginTop:3},slot:{height:54,borderWidth:1,borderColor:'#E6DBD7',borderRadius:15,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:15,marginBottom:8},slotSelected:{borderColor:plum,backgroundColor:'#F7EDF1'},slotText:{fontWeight:'700',color:'#51444A'},form:{gap:9},formInput:{height:53,borderRadius:14,backgroundColor:'#fff',borderWidth:1,borderColor:'#E6DBD7',paddingHorizontal:15,fontSize:14},promise:{flexDirection:'row',gap:10,backgroundColor:'#E7F3ED',padding:14,borderRadius:15,marginTop:16},promiseText:{flex:1,fontSize:11.5,lineHeight:17,color:'#346551'},
  success:{flex:1,backgroundColor:'#FBF7F3',padding:24,justifyContent:'center',alignItems:'center'},successIcon:{width:82,height:82,borderRadius:41,backgroundColor:'#3D946E',alignItems:'center',justifyContent:'center'},successTitle:{fontSize:29,fontWeight:'900',textAlign:'center',color:ink,marginTop:25},successText:{fontSize:15,lineHeight:22,textAlign:'center',color:'#75676D',marginTop:12},confirmCard:{width:'100%',backgroundColor:'#fff',borderRadius:20,padding:20,marginVertical:28},confirmLabel:{fontSize:9,letterSpacing:1.5,fontWeight:'900',color:'#A76C37'},confirmName:{fontSize:18,fontWeight:'900',marginTop:8},confirmMeta:{color:'#887B81',marginTop:6},
  nav:{position:'absolute',bottom:0,left:0,right:0,height:78,backgroundColor:'rgba(255,255,255,.98)',borderTopWidth:1,borderTopColor:'#EEE5E2',flexDirection:'row',paddingTop:9},navItem:{flex:1,alignItems:'center'},navActive:{width:42,height:30,borderRadius:16,backgroundColor:'#F3E4EA',alignItems:'center',justifyContent:'center'},navText:{fontSize:10,color:'#97898F',fontWeight:'700',marginTop:3},placeholder:{flex:1,alignItems:'center',justifyContent:'center',padding:40},placeholderTitle:{fontSize:26,fontWeight:'900',marginTop:16},placeholderText:{fontSize:14,color:'#8A7B82',textAlign:'center',lineHeight:21,marginTop:8}
  ,auth:{flexGrow:1,padding:24,paddingBottom:120,justifyContent:'center',backgroundColor:'#FBF7F3'},brandMark:{width:58,height:58,borderRadius:19,backgroundColor:plum,alignItems:'center',justifyContent:'center',marginBottom:24},authTitle:{fontSize:29,fontWeight:'900',color:ink},authSub:{fontSize:14,lineHeight:21,color:'#7C6E74',marginTop:9,marginBottom:25},authInput:{height:56,borderRadius:16,borderWidth:1,borderColor:'#E4D8D5',backgroundColor:'#fff',paddingHorizontal:16,fontSize:15,marginBottom:10},authSwitch:{color:plum,fontWeight:'800',textAlign:'center',marginTop:20},subPage:{padding:20,paddingBottom:120},pageEyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.6,color:'#A76C37',marginTop:12},pageTitle:{fontSize:30,fontWeight:'900',color:ink,marginTop:4},historyCard:{backgroundColor:'#fff',borderRadius:18,padding:16,marginTop:14},historyTop:{flexDirection:'row',alignItems:'center',gap:11},historyIcon:{width:42,height:42,borderRadius:14,backgroundColor:'#F3E5EA',alignItems:'center',justifyContent:'center'},historyName:{fontWeight:'900',fontSize:15,color:ink},historyMeta:{fontSize:11,color:'#887A80',marginTop:4},status:{fontSize:9,fontWeight:'900',color:'#267255',backgroundColor:'#E5F3EC',paddingHorizontal:8,paddingVertical:5,borderRadius:10,textTransform:'uppercase'},statusCancelled:{color:'#9C2940',backgroundColor:'#FBE9EC'},historyRef:{fontSize:10,color:'#A2959A',marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:'#F0E8E5'},cancelButton:{height:42,borderRadius:13,borderWidth:1,borderColor:'#EAC9D0',marginTop:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},cancelButtonText:{fontSize:12,fontWeight:'900',color:'#B23750'},cancelConfirm:{backgroundColor:'#FBF0F2',borderRadius:14,padding:12,marginTop:12},cancelQuestion:{fontSize:12.5,fontWeight:'900',color:'#7E2739',textAlign:'center'},cancelActions:{flexDirection:'row',gap:8,marginTop:10},keepButton:{flex:1,height:39,borderRadius:11,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},keepButtonText:{fontSize:11,fontWeight:'900',color:plum},confirmCancelButton:{flex:1,height:39,borderRadius:11,backgroundColor:'#B23750',alignItems:'center',justifyContent:'center'},confirmCancelText:{fontSize:11,fontWeight:'900',color:'#fff'},emptyLarge:{alignItems:'center',paddingTop:110},emptyTitle:{fontSize:20,fontWeight:'900',marginTop:14},ownerSub:{color:'#806F76',marginTop:7},statGrid:{flexDirection:'row',flexWrap:'wrap',gap:11,marginTop:22},statCard:{width:'48%',backgroundColor:'#fff',borderRadius:18,padding:16},statValue:{fontSize:25,fontWeight:'900',color:ink,marginTop:15},statLabel:{fontSize:11,color:'#8D7D84',marginTop:3},ownerAction:{height:62,backgroundColor:'#fff',borderRadius:16,flexDirection:'row',alignItems:'center',paddingHorizontal:16,gap:12,marginBottom:9},ownerActionText:{flex:1,fontWeight:'800',color:ink},profile:{flex:1,alignItems:'center',padding:24,paddingTop:70},avatar:{width:88,height:88,borderRadius:44,backgroundColor:plum,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:34,fontWeight:'900',color:'#fff'},profileName:{fontSize:23,fontWeight:'900',marginTop:17},profileEmail:{color:'#85767D',marginTop:5},backendBadge:{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'#fff',paddingHorizontal:14,paddingVertical:9,borderRadius:16,marginTop:20},backendDot:{width:8,height:8,borderRadius:4},backendText:{fontSize:11,fontWeight:'800',color:'#74666C'},logout:{position:'absolute',bottom:110,left:24,right:24,height:54,borderRadius:16,borderWidth:1,borderColor:'#E6CCD2',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},logoutText:{color:'#B23750',fontWeight:'900'}
  ,loginPage:{flexGrow:1,backgroundColor:'#FBF7F3'},loginVisual:{height:375,overflow:'hidden'},loginBrand:{position:'absolute',top:25,left:20,flexDirection:'row',alignItems:'center',gap:10},loginLogo:{width:53,height:53,borderRadius:17},brandName:{fontSize:21,color:'#fff',fontWeight:'900',letterSpacing:-.5},brandLine:{fontSize:7.5,color:'#F3C776',fontWeight:'900',letterSpacing:1.5,marginTop:2},loginHeroCopy:{position:'absolute',left:22,right:22,bottom:57},loginHeroTitle:{fontSize:32,lineHeight:37,color:'#fff',fontWeight:'900',letterSpacing:-.8},loginHeroSub:{fontSize:13,lineHeight:19,color:'#EEDDE4',marginTop:10,maxWidth:330},loginSheet:{marginTop:-28,borderTopLeftRadius:30,borderTopRightRadius:30,backgroundColor:'#FBF7F3',paddingHorizontal:22,paddingTop:13,paddingBottom:35},sheetHandle:{width:42,height:4,borderRadius:3,backgroundColor:'#D8C9CE',alignSelf:'center',marginBottom:14},accountTabs:{height:48,backgroundColor:'#EEE3DF',borderRadius:16,padding:4,flexDirection:'row',marginBottom:18},accountTab:{flex:1,alignItems:'center',justifyContent:'center',borderRadius:13},accountTabActive:{backgroundColor:'#fff',shadowColor:'#4A2432',shadowOpacity:.09,shadowRadius:6,elevation:2},accountTabText:{fontSize:13,fontWeight:'800',color:'#8D7B82'},accountTabTextActive:{color:plum},loginTitle:{fontSize:25,fontWeight:'900',color:ink,textAlign:'center'},loginSub:{fontSize:13,color:'#817279',textAlign:'center',marginTop:6,marginBottom:18},quickLogin:{height:72,borderRadius:19,backgroundColor:'#F1E2E8',borderWidth:1,borderColor:'#E3C5D1',paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:11},quickIcon:{width:44,height:44,borderRadius:15,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},quickTitle:{fontSize:15,fontWeight:'900',color:plum},quickSub:{fontSize:10.5,color:'#806B74',marginTop:3},orRow:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:17},orLine:{height:1,backgroundColor:'#E3D7D3',flex:1},orText:{fontSize:8.5,fontWeight:'900',letterSpacing:1.1,color:'#9A8B91'},methodTabs:{height:46,backgroundColor:'#F0E5E1',borderRadius:15,padding:4,flexDirection:'row',marginBottom:11},methodTab:{flex:1,borderRadius:12,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center'},methodTabActive:{backgroundColor:plum},methodText:{fontSize:12,fontWeight:'900',color:plum},loginInput:{height:54,borderWidth:1,borderColor:'#E2D7D3',backgroundColor:'#fff',borderRadius:16,flexDirection:'row',alignItems:'center',paddingHorizontal:15,marginBottom:9},loginInputText:{flex:1,fontSize:14,paddingLeft:10,color:ink},countryCode:{fontSize:14,fontWeight:'900',color:plum},phoneDivider:{height:25,width:1,backgroundColor:'#E0D2D0',marginLeft:10},resend:{fontSize:11,fontWeight:'900',color:plum},loginButton:{height:56,borderRadius:17,backgroundColor:plum,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:3,shadowColor:plum,shadowOpacity:.22,shadowRadius:10,shadowOffset:{width:0,height:5},elevation:4},loginButtonText:{fontSize:15,color:'#fff',fontWeight:'900'},phoneQuickButton:{height:48,borderRadius:15,borderWidth:1,borderColor:'#DDBFCC',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:10},phoneQuickText:{fontSize:12.5,fontWeight:'900',color:plum},partnerLogin:{fontSize:11.5,color:'#9A6B38',fontWeight:'800',textAlign:'center',marginTop:18}
  ,modalShade:{flex:1,backgroundColor:'rgba(24,8,15,.58)',justifyContent:'flex-end'},filterSheet:{backgroundColor:'#FBF7F3',borderTopLeftRadius:28,borderTopRightRadius:28,padding:22,paddingBottom:35},filterHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},filterTitle:{fontSize:23,fontWeight:'900',color:ink},filterLabel:{fontSize:12,fontWeight:'900',color:'#6F6067',marginTop:25,marginBottom:12},capacityRow:{flexDirection:'row',gap:8},capacityChoice:{flex:1,height:44,borderRadius:13,backgroundColor:'#fff',borderWidth:1,borderColor:'#E1D5D1',alignItems:'center',justifyContent:'center'},capacityChoiceActive:{backgroundColor:plum,borderColor:plum},capacityText:{fontSize:12,fontWeight:'900',color:plum},authNotice:{borderRadius:15,padding:12,flexDirection:'row',gap:10,marginBottom:13,borderWidth:1},authNoticeSuccess:{backgroundColor:'#E5F3EC',borderColor:'#B9DFCD'},authNoticeError:{backgroundColor:'#FBE9EC',borderColor:'#EFC5CE'},authNoticeTitle:{fontSize:13,fontWeight:'900'},authNoticeMessage:{fontSize:11.5,lineHeight:16,color:'#695B61',marginTop:2},splash:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:plum},splashGlow:{position:'absolute',width:260,height:260,borderRadius:130,backgroundColor:'rgba(230,154,59,.12)'},splashLogo:{width:116,height:116,borderRadius:34,borderWidth:1,borderColor:'rgba(255,215,145,.45)'},splashName:{fontSize:35,fontWeight:'900',color:'#fff',letterSpacing:-1,marginTop:20},splashLine:{fontSize:9,fontWeight:'900',letterSpacing:2.3,color:'#F3C776',marginTop:7},splashLoader:{position:'absolute',bottom:65,width:100,height:3,borderRadius:3,backgroundColor:'rgba(255,255,255,.2)',overflow:'hidden'},splashLoaderFill:{width:'70%',height:'100%',backgroundColor:gold,borderRadius:3}
});
