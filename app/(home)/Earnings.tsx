import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Award,
  Target,
  Zap,
  Clock,
  Info,
} from 'lucide-react-native';
import { getCurrentWeekEarnings, getEarningsHistory, getRiderIncentives, getRiderWallet } from '../api/earnings';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatDateRange = (start, end) => {
  return `${formatDate(start)} – ${formatDate(end)}`;
};

const EarningScreen = () => {
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [currentWeek, setCurrentWeek] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [incentives, setIncentives] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [weekRes, walletRes, historyRes, incentiveRes] = await Promise.allSettled([
        getCurrentWeekEarnings(),
        getRiderWallet(),
        getEarningsHistory(1, 10),
        getRiderIncentives(),
      ]);

      if (weekRes.status === 'fulfilled' && weekRes.value.success) {
        setCurrentWeek(weekRes.value);
      }
      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setWalletBalance(walletRes.value.balance || 0);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value.success) {
        setHistory(historyRes.value.payouts || []);
      }
      if (incentiveRes.status === 'fulfilled' && incentiveRes.value.success) {
        setIncentives(incentiveRes.value.incentives || []);
      }
    } catch (err) {
      console.error('Fetch earnings error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleWeek = (id) => setExpandedWeek(expandedWeek === id ? null : id);

  const payout = currentWeek?.payout || {};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16 }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
    >
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>
        Earnings
      </Text>
      <Text style={{ color: '#64748b', marginBottom: 20 }}>Track your delivery income</Text>

      {/* ── Summary Cards ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#10b981', borderRadius: 16, padding: 16, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <DollarSign color="white" size={18} />
            <Text style={{ color: 'white', marginLeft: 6, fontWeight: '500' }}>This Week</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            ₹{(payout.netPayout || 0).toFixed(0)}
          </Text>
          <Text style={{ color: '#d1fae5', fontSize: 12 }}>
            {payout.completedOrders || 0} deliveries
          </Text>
        </View>

        <View style={{ flex: 1, backgroundColor: '#3b82f6', borderRadius: 16, padding: 16, marginLeft: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Package color="white" size={18} />
            <Text style={{ color: 'white', marginLeft: 6, fontWeight: '500' }}>Wallet</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            ₹{walletBalance.toFixed(0)}
          </Text>
          <Text style={{ color: '#dbeafe', fontSize: 12 }}>Available balance</Text>
        </View>
      </View>

      {/* ── Incentive Bonus Card ── */}
      {payout.totalIncentive > 0 && (
        <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Award color="#f59e0b" size={22} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: '700', color: '#92400e', fontSize: 15 }}>
              +₹{payout.totalIncentive} Incentive Bonus!
            </Text>
            <Text style={{ color: '#a16207', fontSize: 12 }}>Added to your weekly payout</Text>
          </View>
        </View>
      )}

      {/* ── Incentive Tracker ── */}
      {incentives.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 }}>
            🎯 Incentives
          </Text>
          {incentives.map((inc) => {
            const progress = inc.progress || {};
            const nextSlab = progress.nextSlab;
            const currentSlab = progress.currentSlab;
            const ordersToNext = progress.ordersToNextSlab || 0;
            const maxOrders = nextSlab ? nextSlab.minOrders : (currentSlab ? currentSlab.minOrders : 1);
            const progressRatio = Math.min((progress.completedOrders || 0) / maxOrders, 1);

            return (
              <View
                key={inc._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Target color={inc.type === 'daily' ? '#f59e0b' : '#8b5cf6'} size={18} />
                    <Text style={{ marginLeft: 8, fontWeight: '700', color: '#1e293b' }}>{inc.name}</Text>
                  </View>
                  <View style={{ backgroundColor: inc.type === 'daily' ? '#fef3c7' : '#ede9fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: inc.type === 'daily' ? '#92400e' : '#6d28d9' }}>
                      {inc.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={{ marginTop: 10 }}>
                  <View style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4 }}>
                    <View
                      style={{
                        height: 8,
                        width: `${progressRatio * 100}%`,
                        backgroundColor: currentSlab ? '#10b981' : '#3b82f6',
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                      {progress.completedOrders || 0} orders
                    </Text>
                    {nextSlab ? (
                      <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>
                        {ordersToNext} more → ₹{nextSlab.bonus}
                      </Text>
                    ) : currentSlab ? (
                      <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>
                        ✅ Earned ₹{currentSlab.bonus}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Conditions */}
                {inc.conditions && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
                    {inc.conditions.maxCancellations !== null && inc.conditions.maxCancellations !== undefined && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Info size={11} color="#ef4444" />
                        <Text style={{ fontSize: 10, color: '#991b1b', marginLeft: 3 }}>
                          Max {inc.conditions.maxCancellations} cancel
                        </Text>
                      </View>
                    )}
                    {inc.conditions.minLoginHours !== null && inc.conditions.minLoginHours !== undefined && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Clock size={11} color="#3b82f6" />
                        <Text style={{ fontSize: 10, color: '#1e40af', marginLeft: 3 }}>
                          Min {inc.conditions.minLoginHours}h online
                        </Text>
                      </View>
                    )}
                    {inc.conditions.activeTimeWindow?.startTime && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Zap size={11} color="#22c55e" />
                        <Text style={{ fontSize: 10, color: '#166534', marginLeft: 3 }}>
                          {inc.conditions.activeTimeWindow.startTime}–{inc.conditions.activeTimeWindow.endTime}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Today's Daily Breakdown ── */}
      {currentWeek?.dailyBreakdown && currentWeek.dailyBreakdown.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 }}>
            📅 This Week – Daily
          </Text>
          {currentWeek.dailyBreakdown.map((day, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 12,
                marginBottom: 6,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text style={{ fontWeight: '600', color: '#1e293b' }}>
                  {DAY_NAMES[new Date(day.date).getDay()]}
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(day.date)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#059669', fontWeight: '700', fontSize: 15 }}>
                  ₹{(day.totalEarnings || 0).toFixed(0)}
                </Text>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>{day.completedOrders || 0} orders</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── This Week's Orders ── */}
      {currentWeek?.payout?.orders && currentWeek.payout.orders.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 }}>
            🛵 Recent Orders
          </Text>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 12 }}>
            {currentWeek.payout.orders.slice().reverse().map((order, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  padding: 12,
                  marginVertical: 4,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b' }}>
                    {order.description || `Order #${order.orderId?.toString().slice(-5)}`}
                  </Text>
                  {order.settledAt && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(order.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(order.settledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <Text style={{ fontWeight: '700', fontSize: 15, color: order.type === 'credit' ? '#059669' : '#ef4444' }}>
                  {order.type === 'credit' ? '+' : '-'}₹{order.amount?.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Past Weeks ── */}
      {history.length > 0 && (
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 }}>
            📊 Past Payouts
          </Text>
          {history.map((week) => (
            <View
              key={week._id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              <TouchableOpacity
                onPress={() => toggleWeek(week._id)}
                style={{
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: '#1e293b' }}>
                      ₹{(week.finalAmount || 0).toFixed(0)}
                    </Text>
                    <View style={{ 
                      backgroundColor: week.status === 'paid' ? '#dcfce7' : week.status === 'finalized' ? '#fef08a' : '#fef2f2',
                      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: week.status === 'paid' ? '#166534' : week.status === 'finalized' ? '#854d0e' : '#991b1b' }}>
                        {week.status === 'paid' ? 'PAID' : week.status === 'finalized' ? 'PENDING' : 'FAILED'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Calendar size={14} color="#64748b" />
                    <Text style={{ color: '#64748b', marginLeft: 4, fontSize: 13 }}>
                      {formatDateRange(week.weekStart, week.weekEnd)}
                    </Text>
                    <Text style={{ color: '#94a3b8', marginLeft: 8, fontSize: 12 }}>
                      • {week.completedOrders || 0} orders
                    </Text>
                  </View>
                </View>
                {expandedWeek === week._id ? (
                  <ChevronUp color="#94a3b8" size={20} style={{ marginLeft: 8 }} />
                ) : (
                  <ChevronDown color="#94a3b8" size={20} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>

              {expandedWeek === week._id && week.orders && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                  {week.orders.slice(-10).map((order, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: 10,
                        padding: 10,
                        marginVertical: 3,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#64748b' }}>
                        {order.description || `Order #${order.orderId?.toString().slice(-5)}`}
                      </Text>
                      <Text style={{ fontWeight: '600', color: order.type === 'credit' ? '#059669' : '#ef4444' }}>
                        {order.type === 'credit' ? '+' : '-'}₹{order.amount?.toFixed(0)}
                      </Text>
                    </View>
                  ))}
                  {week.totalIncentive > 0 && (
                    <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '600' }}>🎯 Incentive Bonus</Text>
                      <Text style={{ fontWeight: '700', color: '#f59e0b' }}>+₹{week.totalIncentive}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default EarningScreen;
