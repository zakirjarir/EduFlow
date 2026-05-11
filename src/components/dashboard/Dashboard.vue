<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  DollarSign, 
  Clock, 
  ArrowUpRight
} from 'lucide-vue-next';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale 
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const stats = ref({
  totalStudents: 0,
  presentToday: 0,
  absentToday: 0,
  totalFees: 0,
  dueFees: 0,
});

const chartData = ref<any>({
  labels: [],
  datasets: []
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
};

const loadStats = async () => {
  const students = await api.students.getAll();
  const attendance = await api.attendance.getAll();
  const fees = await api.fees.getAll();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAttendance = attendance.filter(a => a.date === today);
  
  const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentCount = students.length - presentCount;

  const totalFees = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const dueFees = fees.filter(f => f.status === 'due').reduce((sum, f) => sum + f.amount, 0);

  stats.value = {
    totalStudents: students.length,
    presentToday: presentCount,
    absentToday: absentCount,
    totalFees,
    dueFees,
  };

  // Prepare chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return format(d, 'yyyy-MM-dd');
  }).reverse();

  chartData.value = {
    labels: last7Days.map(date => {
      const parts = date.split('-');
      return format(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])), 'EEE');
    }),
    datasets: [
      {
        label: 'Present',
        backgroundColor: '#4F46E5',
        data: last7Days.map(date => attendance.filter(a => a.date === date && a.status === 'present').length)
      },
      {
        label: 'Absent',
        backgroundColor: '#EF4444',
        data: last7Days.map(date => attendance.filter(a => a.date === date && a.status === 'absent').length)
      }
    ]
  };
};

onMounted(loadStats);

const statCards = computed(() => [
  { label: 'Total Students', value: stats.value.totalStudents, icon: Users, color: 'bg-blue-500', trend: '+12%' },
  { label: 'Present Today', value: stats.value.presentToday, icon: UserCheck, color: 'bg-green-500', trend: '85%' },
  { label: 'Absent Today', value: stats.value.absentToday, icon: UserPlus, color: 'bg-red-500', trend: '15%' },
  { label: 'Total Fees Collected', value: `$${stats.value.totalFees}`, icon: DollarSign, color: 'bg-indigo-500', trend: 'Monthly' },
]);
</script>

<template>
  <div class="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in active">
    <header>
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      <p class="text-sm sm:text-base text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
    </header>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div v-for="(card, idx) in statCards" :key="idx" class="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-3 sm:mb-4">
          <div :class="cn('p-2 sm:p-3 rounded-xl text-white', card.color)">
            <component :is="card.icon" :size="20" class="sm:hidden" />
            <component :is="card.icon" :size="24" class="hidden sm:block" />
          </div>
          <span class="text-[8px] sm:text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-500 rounded-lg flex items-center gap-1">
            {{ card.trend }}
            <ArrowUpRight :size="10" class="sm:hidden text-green-500" />
            <ArrowUpRight :size="12" class="hidden sm:block text-green-500" />
          </span>
        </div>
        <h3 class="text-[10px] sm:text-sm font-medium text-gray-500">{{ card.label }}</h3>
        <p class="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{{ card.value }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Attendance Chart -->
      <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-gray-900 flex items-center gap-2">
            <Clock :size="18" class="text-indigo-600" />
            Weekly Attendance
          </h3>
          <select class="text-sm border-none bg-gray-50 rounded-lg px-2 py-1 outline-none cursor-pointer">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div class="h-64">
           <Bar 
             :data="chartData"
             :options="chartOptions"
           />
        </div>
      </div>

      <!-- Financial Health -->
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 class="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign :size="18" class="text-indigo-600" />
          Financial Health
        </h3>
        <div class="space-y-6">
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-500">Collected Fees</span>
              <span class="font-bold text-green-600">${{ stats.totalFees }}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-green-500 h-full transition-all duration-1000" 
                :style="{ width: `${(stats.totalFees / (stats.totalFees + stats.dueFees || 1)) * 100}%` }"
              />
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-500">Due Fees</span>
              <span class="font-bold text-red-600">${{ stats.dueFees }}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-red-500 h-full transition-all duration-1000" 
                :style="{ width: `${(stats.dueFees / (stats.totalFees + stats.dueFees || 1)) * 100}%` }"
              />
            </div>
          </div>
          
          <div class="pt-4 border-t border-gray-50">
             <p class="text-xs text-gray-400 italic">"Management of fees is critical for college operations. Follow up with due students."</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
