import { Link, Outlet } from 'umi';
import React from 'react';
import styles from './index.less';

export default function Layout() {
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
      <Outlet />
    </div>
  );
}
