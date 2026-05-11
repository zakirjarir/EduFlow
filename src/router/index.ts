import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { api } from '../services/api';
import Dashboard from '../components/dashboard/Dashboard.vue';
import StudentManager from '../components/students/StudentManager.vue';
import AttendanceSystem from '../components/attendance/AttendanceSystem.vue';
import QRScanner from '../components/attendance/QRScanner.vue';
import FeesManager from '../components/fees/FeesManager.vue';
import StudentPanel from '../components/student-panel/StudentPanel.vue';
import Login from '../components/auth/Login.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/students',
    name: 'Students',
    component: StudentManager,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: AttendanceSystem,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/qr-scan',
    name: 'QRScan',
    component: QRScanner,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/fees',
    name: 'Fees',
    component: FeesManager,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/portal',
    name: 'StudentPortal',
    component: StudentPanel,
    meta: { requiresAuth: true, role: 'student' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const session = await api.auth.getCurrentSession();
  const isAuthenticated = !!session;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  if (to.meta.guestOnly && isAuthenticated) {
    // Redirect based on role if already logged in
    try {
      const profile = await api.auth.getUserProfile(session!.user.id);
      if (profile.role === 'admin') return next({ name: 'Dashboard' });
      return next({ name: 'StudentPortal' });
    } catch (err) {
      return next();
    }
  }

  if (to.meta.role && isAuthenticated) {
    try {
      const profile = await api.auth.getUserProfile(session!.user.id);
      if (to.meta.role !== profile.role) {
        // Forbidden - redirect to their own portal/dashboard
        if (profile.role === 'admin') return next({ name: 'Dashboard' });
        return next({ name: 'StudentPortal' });
      }
    } catch (err) {
      return next({ name: 'Login' });
    }
  }

  next();
});

export default router;
