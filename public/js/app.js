// ============ APP.JS - Main Application Logic ============

// Theme management
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('akel_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize theme
const savedTheme = localStorage.getItem('akel_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// Toast notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Copy text
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(t('msg.copied'));
  }).catch(() => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(t('msg.copied'));
  });
}

// Mobile menu
function toggleMobileMenu() {
  document.getElementById('mobileNav').classList.toggle('show');
}

// User menu
function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('show');
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('userDropdown')?.classList.remove('show');
  }
});

// Auth state management
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    
    if (data.authenticated) {
      const authButtons = document.getElementById('authButtons');
      const userMenu = document.getElementById('userMenu');
      
      // Update UI elements if they exist (main page)
      if (authButtons && userMenu) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        
        const avatar = userMenu.querySelector('.user-avatar');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        if (avatar) avatar.textContent = data.user.full_name.charAt(0).toUpperCase();
        if (userName) userName.textContent = data.user.full_name;
        if (userRole) userRole.textContent = data.user.role === 'admin' ? 'Администратор' : 'Муштарӣ';
        
        // Add admin link if admin
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && data.user.role === 'admin' && !dropdown.querySelector('.admin-link')) {
          const adminLink = document.createElement('a');
          adminLink.href = '/admin';
          adminLink.className = 'admin-link';
          adminLink.setAttribute('data-i18n', 'nav.admin');
          adminLink.textContent = '👑 Админ';
          dropdown.insertBefore(adminLink, dropdown.children[1]);
        }
      }
      
      return data;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  return null;
}

// Logout
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Login form handler
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const login = form.login.value;
  const password = form.password.value;
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    
    const data = await res.json();
    
    if (data.success) {
      showToast(t('msg.welcome') + ' ' + data.name);
      setTimeout(() => {
        if (data.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }, 500);
    } else {
      showToast(data.error, 'error');
    }
  } catch (error) {
    showToast(t('msg.error'), 'error');
  }
}

// Register form handler
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  
  if (form.password.value !== form.confirm_password.value) {
    showToast('Паролҳо мувофиқ нест!', 'error');
    return;
  }
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name.value,
        phone: form.phone.value,
        email: form.email.value,
        login: form.login.value,
        password: form.password.value
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      showToast(t('msg.welcome'));
      setTimeout(() => window.location.href = '/dashboard', 500);
    } else {
      showToast(data.error, 'error');
    }
  } catch (error) {
    showToast(t('msg.error'), 'error');
  }
}

// Hero tracking
async function heroTrack() {
  const input = document.getElementById('heroTrackingInput');
  const result = document.getElementById('heroTrackingResult');
  
  if (!input.value.trim()) return;
  
  try {
    const res = await fetch(`/api/tracking/${input.value.trim()}`);
    const data = await res.json();
    
    if (res.ok) {
      const pkg = data.package;
      const statusText = t('status.' + pkg.status) || pkg.status;
      const progress = getStatusProgress(pkg.status);
      
      result.innerHTML = `
        <div class="tracking-status show" style="margin-top:16px;">
          <div style="width:40px;height:40px;background:rgba(34,197,94,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;">✓</div>
          <div>
            <div style="font-weight:600;">${statusText}</div>
            <div style="font-size:13px;color:var(--text-muted);">${pkg.current_location || ''}</div>
          </div>
        </div>
        <div class="tracking-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
          <div class="progress-steps">
            <span class="progress-step ${progress >= 0 ? 'active' : ''}">📦</span>
            <span class="progress-step ${progress >= 25 ? 'active' : ''}">🚢</span>
            <span class="progress-step ${progress >= 50 ? 'active' : ''}">🛃</span>
            <span class="progress-step ${progress >= 75 ? 'active' : ''}">✈️</span>
            <span class="progress-step ${progress >= 100 ? 'active' : ''}">✅</span>
          </div>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="tracking-status show" style="margin-top:16px;background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);">
          <div style="width:40px;height:40px;background:rgba(239,68,68,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</div>
          <div>
            <div style="font-weight:600;">${t('track.notFound')}</div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    showToast(t('msg.error'), 'error');
  }
}

function getStatusProgress(status) {
  const statuses = {
    'received_china': 10,
    'in_transit': 40,
    'customs': 60,
    'received_tj': 80,
    'delivered': 100,
    'pending': 5
  };
  return statuses[status] || 0;
}

// Contact form
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        subject: form.subject.value,
        message: form.message.value
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      showToast(t('msg.sent'));
      form.reset();
    } else {
      showToast(data.error || t('msg.error'), 'error');
    }
  } catch (error) {
    showToast(t('msg.error'), 'error');
  }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu
      document.getElementById('mobileNav')?.classList.remove('show');
    }
  });
});

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Active nav link
function updateActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPos = window.scrollY + 100;
  
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    
    if (scrollPos >= top && scrollPos < top + height) {
      document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', updateActiveLink);

// Enter key for tracking
document.getElementById('heroTrackingInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') heroTrack();
});

// Initialize auth check
checkAuth();

// Apply translations after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
});
