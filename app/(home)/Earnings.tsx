import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react-native';

const EarningScreen = () => {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const weeklyData = [
    {
      id: 1,
      week: 'Week 1',
      dateRange: 'Oct 1 - Oct 7',
      totalEarnings: 1250.5,
      deliveries: 45,
      avgPerDelivery: 27.79,
      trend: 12,
      dailyBreakdown: [
        { day: 'Monday', date: 'Oct 1', earnings: 180.5, deliveries: 7, hours: 6.5 },
        { day: 'Tuesday', date: 'Oct 2', earnings: 165.0, deliveries: 6, hours: 5.8 },
        { day: 'Wednesday', date: 'Oct 3', earnings: 220.75, deliveries: 8, hours: 7.2 },
        { day: 'Thursday', date: 'Oct 4', earnings: 195.25, deliveries: 7, hours: 6.3 },
        { day: 'Friday', date: 'Oct 5', earnings: 245.0, deliveries: 9, hours: 8.0 },
        { day: 'Saturday', date: 'Oct 6', earnings: 160.0, deliveries: 5, hours: 5.5 },
        { day: 'Sunday', date: 'Oct 7', earnings: 84.0, deliveries: 3, hours: 3.0 },
      ],
    },
    {
      id: 2,
      week: 'Week 2',
      dateRange: 'Oct 8 - Oct 14',
      totalEarnings: 1420.75,
      deliveries: 52,
      avgPerDelivery: 27.32,
      trend: 8,
      dailyBreakdown: [
        { day: 'Monday', date: 'Oct 8', earnings: 205.5, deliveries: 8, hours: 7.0 },
        { day: 'Tuesday', date: 'Oct 9', earnings: 190.0, deliveries: 7, hours: 6.2 },
        { day: 'Wednesday', date: 'Oct 10', earnings: 235.25, deliveries: 9, hours: 7.8 },
        { day: 'Thursday', date: 'Oct 11', earnings: 210.0, deliveries: 8, hours: 6.8 },
        { day: 'Friday', date: 'Oct 12', earnings: 280.0, deliveries: 10, hours: 8.5 },
        { day: 'Saturday', date: 'Oct 13', earnings: 215.0, deliveries: 7, hours: 6.5 },
        { day: 'Sunday', date: 'Oct 14', earnings: 85.0, deliveries: 3, hours: 3.2 },
      ],
    },
    {
      id: 3,
      week: 'Week 3',
      dateRange: 'Oct 15 - Oct 16',
      totalEarnings: 385.5,
      deliveries: 15,
      avgPerDelivery: 25.7,
      trend: -5,
      dailyBreakdown: [
        { day: 'Monday', date: 'Oct 15', earnings: 195.5, deliveries: 8, hours: 6.8 },
        { day: 'Tuesday', date: 'Oct 16', earnings: 190.0, deliveries: 7, hours: 6.5 },
      ],
    },
  ];

  const totalEarnings = weeklyData.reduce((sum, week) => sum + week.totalEarnings, 0);
  const totalDeliveries = weeklyData.reduce((sum, week) => sum + week.deliveries, 0);

  const toggleWeek = (weekId: number) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>
        Earnings
      </Text>
      <Text style={{ color: '#64748b', marginBottom: 20 }}>Track your delivery income</Text>

      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#10b981',
            borderRadius: 16,
            padding: 16,
            marginRight: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <DollarSign color="white" size={18} />
            <Text style={{ color: 'white', marginLeft: 6 }}>Total Earned</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            ${totalEarnings.toFixed(2)}
          </Text>
          <Text style={{ color: '#d1fae5', fontSize: 12 }}>Last 3 weeks</Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: '#3b82f6',
            borderRadius: 16,
            padding: 16,
            marginLeft: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Package color="white" size={18} />
            <Text style={{ color: 'white', marginLeft: 6 }}>Deliveries</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            {totalDeliveries}
          </Text>
          <Text style={{ color: '#dbeafe', fontSize: 12 }}>Total orders</Text>
        </View>
      </View>

      {/* Weekly Breakdown */}
      {weeklyData.map((week) => (
        <View
          key={week.id}
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <TouchableOpacity
            onPress={() => toggleWeek(week.id)}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>
                {week.week}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Calendar size={14} color="#64748b" />
                <Text style={{ color: '#64748b', marginLeft: 4 }}>{week.dateRange}</Text>
              </View>
            </View>
            {expandedWeek === week.id ? (
              <ChevronUp color="#94a3b8" size={20} />
            ) : (
              <ChevronDown color="#94a3b8" size={20} />
            )}
          </TouchableOpacity>

          {expandedWeek === week.id && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              {week.dailyBreakdown.map((day, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    padding: 10,
                    marginVertical: 4,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontWeight: '600', color: '#1e293b' }}>{day.day}</Text>
                  <Text style={{ color: '#059669', fontWeight: '600' }}>
                    ${day.earnings.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export default EarningScreen;
