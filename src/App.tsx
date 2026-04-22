/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  LayoutDashboard, 
  History, 
  PlusCircle, 
  LogOut, 
  Truck, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Navigation,
  CreditCard,
  Star,
  MessageSquare,
  Activity,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type UserRole = 'user' | 'admin' | 'driver';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface Booking {
  id: number;
  userId: number;
  userName?: string;
  address: string;
  date: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'on the way' | 'delivered';
  driverId?: number;
  driverName?: string;
  isPaid: number;
  paymentId?: string;
  rating?: number;
  comment?: string;
  createdAt: string;
}

// --- Components ---

const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => (
  <nav className="bg-white/90 backdrop-blur-md border-b border-blue-100 px-6 py-4 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
    <div className="flex items-center gap-3 group cursor-default">
      <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
        <Droplet className="text-white w-6 h-6 fill-current" />
      </div>
      <span className="font-black text-2xl tracking-tighter text-blue-900 uppercase">AquaFlow</span>
    </div>
    {user && (
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-black text-blue-950 leading-none mb-1">{user.name}</p>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{user.role}</p>
        </div>
        <button 
          onClick={onLogout}
          className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )}
  </nav>
);

const TrackingMap = ({ bookingId }: { bookingId: number }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/track`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setData(await res.json());
    }, 3000);
    return () => clearInterval(timer);
  }, [bookingId]);

  if (!data) return <div className="h-48 bg-slate-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="relative h-64 bg-slate-900 rounded-2xl overflow-hidden border-4 border-white shadow-inner">
        {/* Mock Map Background */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        
        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full">
          <path 
            d="M 40 200 Q 150 50 350 180" 
            fill="none" 
            stroke="#334155" 
            strokeWidth="4" 
            strokeDasharray="8 8"
          />
          <path 
            d="M 40 200 Q 150 50 350 180" 
            fill="none" 
            stroke="#0ea5e9" 
            strokeWidth="4" 
            strokeDasharray="1000"
            strokeDashoffset={1000 - (data.progress * 10)}
            className="transition-all duration-1000"
          />
        </svg>

        {/* Start Point */}
        <div className="absolute left-10 bottom-10">
          <div className="bg-slate-700 p-1.5 rounded-full ring-4 ring-slate-800">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* End Point */}
        <div className="absolute right-10 top-10">
          <div className="bg-primary p-1.5 rounded-full ring-4 ring-primary/20">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Moving Tanker */}
        <motion.div 
          className="absolute z-10"
          animate={{ 
            left: `${10 + (data.progress * 0.8)}%`,
            top: `${80 - (data.progress * 0.6)}%` 
          }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="bg-white p-2 rounded-xl shadow-2xl border border-slate-200">
            <Truck className="w-6 h-6 text-primary" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
          <p className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            {data.status}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">E.T.A</p>
          <p className="text-lg font-black text-slate-900">{data.estimatedTime}</p>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ booking, onPaid, onClose }: { booking: Booking, onPaid: () => void, onClose: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    await fetch(`/api/bookings/${booking.id}/pay`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ paymentMethod: 'card' })
    });
    setLoading(false);
    onPaid();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex bg-primary/10 p-4 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Complete Payment</h2>
          <p className="text-slate-500">Secure checkout for your water booking</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-600">Booking ID</span>
            <span className="font-bold text-slate-900">#{booking.id}</span>
          </div>
          <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-600">Quantity</span>
            <span className="font-bold text-slate-900">{booking.quantity}L</span>
          </div>
          <div className="flex justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <span className="text-primary font-semibold">Amount to Pay</span>
            <span className="text-xl font-black text-primary">₹{(booking.quantity * 0.15).toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
        >
          {loading ? 'Processing...' : (
            <>
              Confirm & Pay Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

const FeedbackModal = ({ bookingId, onDone, onClose }: { bookingId: number, onDone: () => void, onClose: () => void }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/bookings/${bookingId}/feedback`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ rating, comment })
    });
    setSubmitting(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex bg-amber-100 p-4 rounded-full mb-4">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your Opinion Matters</h2>
          <p className="text-slate-500">How was your delivery experience?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-2 transition-transform hover:scale-110 active:scale-95"
              >
                <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Comments</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all h-32 resize-none"
              placeholder="Tell us about the driver, quality, or speed..."
            />
          </div>

          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
            {submitting ? 'Submitting...' : 'Send Feedback'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const UserDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalType, setModalType] = useState<'track' | 'pay' | 'feedback' | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ address, date, quantity })
    });
    if (res.ok) {
      setAddress('');
      setDate('');
      fetchBookings();
    }
  };

  const activeTracking = bookings.find(b => b.status === 'on the way');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-blue-600 p-8 md:p-16 text-white shadow-2xl shadow-blue-200">
        <div className="absolute inset-0 opacity-50">
          <img 
            src="https://picsum.photos/seed/water/1920/1080" 
            alt="Water Tanker" 
            className="w-full h-full object-cover mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-600/60 to-blue-400/30" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-sm font-bold tracking-widest uppercase">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            Vibrant Blue Experience
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight drop-shadow-lg">
            Flowing With<br />
            <span className="text-blue-100 underline decoration-primary decoration-4 underline-offset-8">Precision.</span>
          </h1>
          <p className="text-lg text-blue-50/90 font-medium leading-relaxed max-w-lg">
            Dive into the most advanced water delivery network. 
            Smart tracking, instant blue-speed payments, and purity guaranteed.
          </p>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Tracking */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-100 border border-blue-50">
            <h2 className="text-2xl font-black text-blue-900 mb-8 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-primary" />
              Order Portal
            </h2>
            <form onSubmit={handleBooking} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Destination</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-5 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none font-medium placeholder:text-blue-200"
                  placeholder="Where do you need the flow?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Schedule</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-2 ml-1">Volume</label>
                  <select 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-5 py-4 bg-blue-50/30 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-blue-700"
                  >
                    <option value={1000}>1K Liters</option>
                    <option value={5000}>5K Liters</option>
                    <option value={10000}>10K Liters</option>
                  </select>
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]">
                Initiate Flow
              </button>
            </form>
          </div>

          <AnimatePresence>
            {activeTracking && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <span className="font-bold">Live Tracking</span>
                  </div>
                  <button 
                    onClick={() => { setSelectedBooking(activeTracking); setModalType('track'); }}
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                  >
                    Fullscreen
                  </button>
                </div>
                <TrackingMap bookingId={activeTracking.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Booking History Table */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Order History
            </h2>
            <div className="flex gap-2">
              {['all', 'pending', 'delivered'].map(filter => (
                <button key={filter} className="px-5 py-2 text-sm font-bold rounded-full capitalize bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Order Detail</th>
                  <th className="px-8 py-5">Delivery</th>
                  <th className="px-8 py-5">Payment</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Droplet className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{b.quantity} Liters</p>
                          <p className="text-xs text-slate-400 font-medium">Order ID: #{b.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {b.address}
                        </p>
                        <p className="text-xs text-slate-400">{b.date}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {b.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${b.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                          b.status === 'on the way' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {b.status === 'approved' && !b.isPaid && (
                          <button 
                            onClick={() => { setSelectedBooking(b); setModalType('pay'); }}
                            className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay ₹{(b.quantity * 0.15).toFixed(0)}
                          </button>
                        )}
                        {b.status === 'delivered' && !b.rating && (
                          <button 
                            onClick={() => { setSelectedBooking(b); setModalType('feedback'); }}
                            className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 text-xs font-black rounded-xl hover:bg-amber-100 transition-all flex items-center gap-2"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Feedack
                          </button>
                        )}
                        {b.status === 'on the way' && (
                          <button 
                            onClick={() => { setSelectedBooking(b); setModalType('track'); }}
                            className="px-4 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-secondary transition-all flex items-center gap-2"
                          >
                            <Navigation className="w-3 h-3" />
                            Track
                          </button>
                        )}
                        {b.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-bold text-slate-900">{b.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedBooking && modalType === 'pay' && (
          <PaymentModal 
            booking={selectedBooking} 
            onPaid={() => { setSelectedBooking(null); setModalType(null); fetchBookings(); }}
            onClose={() => { setSelectedBooking(null); setModalType(null); }}
          />
        )}
        {selectedBooking && modalType === 'feedback' && (
          <FeedbackModal 
            bookingId={selectedBooking.id} 
            onDone={() => { setSelectedBooking(null); setModalType(null); fetchBookings(); }}
            onClose={() => { setSelectedBooking(null); setModalType(null); }}
          />
        )}
        {selectedBooking && modalType === 'track' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">
              <button onClick={() => { setSelectedBooking(null); setModalType(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
                <XCircle className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black mb-6">Live Tracking: Order #{selectedBooking.id}</h2>
              <TrackingMap bookingId={selectedBooking.id} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [bRes, dRes] = await Promise.all([
        fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/drivers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setBookings(await bRes.json());
      setDrivers(await dRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async (id: number, status: string, driverId?: number) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status, driverId })
    });
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Admin Command Center</h1>
        <p className="text-slate-500">Manage all requests and dispatch drivers.</p>
      </header>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            All Bookings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Details</th>
                <th className="px-6 py-5">Payment</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-6">
                    <p className="font-bold text-slate-900">{b.userName}</p>
                    <p className="text-xs text-slate-400">ID: #{b.id}</p>
                  </td>
                  <td className="px-6 py-6 text-sm text-slate-600 max-w-xs truncate">{b.address}</td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-slate-900">{b.quantity}L</p>
                    <p className="text-xs text-slate-400">{b.date}</p>
                  </td>
                  <td className="px-6 py-6 text-sm">
                    {b.isPaid ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-500 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${b.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                        b.status === 'on the way' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-bold">
                    {b.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/10"
                          onChange={(e) => handleUpdate(b.id, 'approved', Number(e.target.value))}
                          defaultValue=""
                        >
                          <option value="" disabled>Dispatch Driver</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button 
                          onClick={() => handleUpdate(b.id, 'rejected')}
                          className="px-3 py-2 text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-xl text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-500">
                          {b.driverName ? `Pilot: ${b.driverName}` : 'Finalized'}
                        </p>
                        {b.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] text-slate-900">{b.rating}/5</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const DriverDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchMyBookings = async () => {
    const res = await fetch('/api/bookings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setBookings(await res.json());
  };

  useEffect(() => { fetchMyBookings(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/driver/bookings/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    fetchMyBookings();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Driver Fleet Control</h1>
          <p className="text-slate-500 font-medium">Manage your active routes and complete deliveries.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
            <p className="text-xl font-black text-primary">{bookings.filter(b => b.status === 'on the way').length}</p>
          </div>
          <div className="text-center px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Done</p>
            <p className="text-xl font-black text-emerald-600">{bookings.filter(b => b.status === 'delivered').length}</p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((b) => (
          <motion.div 
            key={b.id} 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="bg-primary/5 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                  ${b.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                    b.status === 'on the way' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {b.status}
                </span>
                {b.isPaid ? (
                  <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> PAID
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-rose-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> UNPAID
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-xl text-slate-900">{b.quantity}L Capacity</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Client: {b.userName}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                <div className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                  <p>{b.address}</p>
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p>{b.date}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-auto">
              {!b.isPaid && b.status !== 'delivered' && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-700 uppercase tracking-wider text-center">
                  Awaiting Customer Payment
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {b.status === 'approved' && (
                  <button 
                    onClick={() => updateStatus(b.id, 'on the way')}
                    disabled={!b.isPaid}
                    className={`col-span-2 py-4 rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95
                      ${b.isPaid ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                  >
                    Engage Delivery
                  </button>
                )}
                {b.status === 'on the way' && (
                  <button 
                    onClick={() => updateStatus(b.id, 'delivered')}
                    className="col-span-2 bg-emerald-600 text-white py-4 rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                  >
                    Complete Delivery
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {bookings.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-100">
            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Missions Assigned</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Auth Views ---

const AuthPage = ({ onLogin }: { onLogin: (u: User, token: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password, role };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          onLogin(data.user, data.token);
        } else {
          setIsLogin(true);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary/10 p-4 rounded-2xl mb-4">
            <Droplet className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">AquaFlow</h1>
          <p className="text-slate-500 mt-2">The future of water logistics</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['user', 'driver', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-sm rounded-xl border transition-all ${role === r ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary'}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-slate-50">
          <p className="text-slate-500">
            {isLogin ? "New to AquaFlow?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? 'Join us today' : 'Sign in here'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return null;

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="pb-20">
        <AnimatePresence mode="wait">
          {user.role === 'user' && (
            <motion.div key="user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UserDashboard />
            </motion.div>
          )}
          {user.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminDashboard />
            </motion.div>
          )}
          {user.role === 'driver' && (
            <motion.div key="driver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DriverDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
