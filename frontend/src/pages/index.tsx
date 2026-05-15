import React, { useEffect } from 'react';
import { history } from 'umi';

export default function HomePage() {
  useEffect(() => {
    history.push('/forum');
  }, []);

  return null;
}
