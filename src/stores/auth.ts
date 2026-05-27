import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi } from '@/api/admin';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '');
  const username = ref(localStorage.getItem('admin_username') || '');
  const role = ref(localStorage.getItem('admin_role') || '');
  const site = ref(localStorage.getItem('admin_site') || '');
  const viewSite = ref(localStorage.getItem('admin_view_site') || '');

  const isLoggedIn = computed(() => !!token.value);
  const isSuper = computed(() => role.value === 'super');
  const currentSite = computed(() => {
    if (role.value === 'site') return site.value;
    return viewSite.value;
  });

  async function login(usernameInput: string, password: string): Promise<boolean> {
    try {
      const res = await loginApi(usernameInput, password);
      token.value = res.token;
      username.value = res.username;
      role.value = res.role;
      site.value = res.site;
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_username', res.username);
      localStorage.setItem('admin_role', res.role);
      localStorage.setItem('admin_site', res.site);
      return true;
    } catch {
      return false;
    }
  }

  function setViewSite(s: string) {
    viewSite.value = s;
    localStorage.setItem('admin_view_site', s);
  }

  function logout() {
    token.value = '';
    username.value = '';
    role.value = '';
    site.value = '';
    viewSite.value = '';
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_site');
    localStorage.removeItem('admin_view_site');
  }

  return { token, username, role, site, viewSite, currentSite, isLoggedIn, isSuper, login, logout, setViewSite };
});
