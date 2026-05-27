
import { getRole } from "../../services/authService";

const ROLE_CONFIG = {
  inspector: { label: 'Land Inspector', color: '#6d28d9', bg: '#ede9fe' },
  seller:    { label: 'Seller',         color: '#0369a1', bg: '#e0f2fe' },
  buyer:     { label: 'Buyer',          color: '#047857', bg: '#d1fae5' },
};

function AdminNavbar({ brandText, toggleSidebar, sidebarOpened, userName, onLogout }) {
  const role = getRole();
  const roleInfo = ROLE_CONFIG[role] || { label: role || 'User', color: '#666', bg: '#f0f0f0' };
  const initials = userName
    ? userName.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      height: 64,
      background: '#ffffff',
      borderBottom: '1px solid #e8ecf0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      flexShrink: 0,
    }}>
      {/* Left: hamburger + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px', borderRadius: 8, display: 'flex',
            flexDirection: 'column', gap: 5, color: '#344675',
          }}
        >
          <span style={{ display: 'block', width: 20, height: 2, background: '#344675', borderRadius: 2, transition: 'width 0.2s' }} />
          <span style={{ display: 'block', width: sidebarOpened ? 20 : 14, height: 2, background: '#344675', borderRadius: 2, transition: 'width 0.2s' }} />
          <span style={{ display: 'block', width: 20, height: 2, background: '#344675', borderRadius: 2 }} />
        </button>

        <div>
          <div style={{ fontSize: 10, color: '#9a9a9a', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1, marginBottom: 3 }}>
            Digital Land Registry
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
            {brandText || 'Dashboard'}
          </div>
        </div>
      </div>

      {/* Right: role badge + avatar + name + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: roleInfo.bg, color: roleInfo.color,
        }}>
          {roleInfo.label}
        </span>

        {userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f7f8fc', borderRadius: 10, border: '1px solid #e8ecf0' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a5276 0%, #6d28d9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#344675', whiteSpace: 'nowrap' }}>
              {userName}
            </span>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'none', border: '1.5px solid #dc3545', color: '#dc3545',
              cursor: 'pointer',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#dc3545'; }}
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminNavbar;
