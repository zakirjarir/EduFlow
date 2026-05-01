<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Sidebar from './components/layout/Sidebar.vue';
import Dashboard from './components/dashboard/Dashboard.vue';
import StudentManager from './components/students/StudentManager.vue';
import AttendanceSystem from './components/attendance/AttendanceSystem.vue';
import QRScanner from './components/attendance/QRScanner.vue';
import FeesManager from './components/fees/FeesManager.vue';
import StudentPanel from './components/student-panel/StudentPanel.vue';
import Login from './components/auth/Login.vue';
import { Search, Bell, User, LogOut } from 'lucide-vue-next';
import { UserRole, Student } from './types';
import { api } from './services/api';

const activeTab = ref('dashboard');
const isSidebarOpen = ref(false);
const authState = ref<{ user: Student | null; role: UserRole | null }>({
  user: null,
  role: null,
});

onMounted(async () => {
  // Check current session
  const session = await api.auth.getCurrentSession();
  if (session?.user) {
    try {
      const profile = await api.auth.getUserProfile(session.user.id);
      authState.value = profile;
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  // Listen for auth changes
  import('./lib/supabase').then(({ supabase }) => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const profile = await api.auth.getUserProfile(session.user.id);
          authState.value = profile;
          if (profile.role === 'student' && activeTab.value === 'dashboard') {
            activeTab.value = 'student-home';
          }
        } catch (err) {
          console.error('Auth state change profile error:', err);
        }
      } else {
        authState.value = { user: null, role: null };
      }
    });
  });
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const handleLogin = (data: { user: Student | null; role: UserRole }) => {
  authState.value = data;
  if (data.role === 'student') {
    activeTab.value = 'student-home';
  }
};

const handleLogout = async () => {
  await api.auth.logout();
  authState.value = { user: null, role: null };
};

const currentComponent = computed(() => {
  if (authState.value.role === 'student') {
    return StudentPanel;
  }

  switch (activeTab.value) {
    case 'dashboard': return Dashboard;
    case 'students': return StudentManager;
    case 'attendance': return AttendanceSystem;
    case 'qr-scan': return QRScanner;
    case 'fees': return FeesManager;
    default: return Dashboard;
  }
});

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <div v-if="!authState.role">
    <Login @login="handleLogin" />
  </div>

  <div v-else class="flex h-screen bg-[#F9FAFB] font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Sidebar (Only for Admin) -->
    <Sidebar 
      v-if="authState.role === 'admin'"
      :activeTab="activeTab" 
      :isOpen="isSidebarOpen"
      @update:activeTab="(tab) => { setActiveTab(tab); closeSidebar(); }" 
      @close="closeSidebar"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Top Navbar -->
      <header class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
        <div class="flex items-center gap-3 sm:gap-4 flex-1">
           <!-- Mobile Menu Toggle -->
           <button 
             v-if="authState.role === 'admin'"
             @click="toggleSidebar"
             class="p-2 sm:hidden text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
           </button>

           <div v-if="authState.role === 'admin'" class="relative max-w-md w-full hidden sm:block">
              <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global search..." 
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-100 transition-all font-medium"
              />
           </div>
           <div v-else class="flex items-center gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base">
                EF
              </div>
              <h1 class="font-bold text-gray-900 text-sm sm:text-base">Student Portal</h1>
           </div>
        </div>
        
        <div class="flex items-center gap-4">
          <button @click="handleLogout" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2">
            <LogOut :size="20" />
            <span class="text-xs font-bold uppercase tracking-wider hidden sm:block">Logout</span>
          </button>
          <div class="h-8 w-[1px] bg-gray-100 mx-2"></div>
          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-gray-900">
                {{ authState.user?.name || 'Administrator' }}
              </p>
              <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {{ authState.role === 'admin' ? 'Super Admin' : `Roll: ${authState.user?.roll}` }}
              </p>
            </div>
            <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <User :size="20" />
            </div>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto bg-gray-50/30">
        <Transition name="fade" mode="out-in">
          <component :is="currentComponent" :student="authState.user" />
        </Transition>
      </main>

      <!-- Footer Info -->
      <footer class="h-10 bg-white border-t border-gray-100 px-4 sm:px-8 flex items-center justify-between text-[8px] sm:text-[10px] text-gray-400 font-medium uppercase tracking-widest shrink-0">
         <span class="truncate">EduFlow System v2.0.0</span>
         <span>Role: {{ authState.role }}</span>
      </footer>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
