import { Link, Outlet, useLocation } from 'umi';
import React from 'react';
import styles from './index.less';

export default function Layout() {
  const location = useLocation();
  const isSpecialPage = location.pathname === '/auth' || location.pathname === '/forum' || location.pathname.startsWith('/forum/');

  if (isSpecialPage) {
    return <Outlet />;
  }

  return (
    <div className={styles.navs}>
      <ul>
        <li>
          <Link to="/">Trang chủ</Link>
        </li>
        <li>
          <Link to="/docs">Tài liệu</Link>
        </li>
        <li>
          <Link to="/auth">Tài khoản</Link>
        </li>
      </ul>
      <div style={{ padding: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
}
