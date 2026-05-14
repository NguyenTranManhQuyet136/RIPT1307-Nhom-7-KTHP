import React from 'react';
import yayJpg from '../assets/yay.jpg';

export default function HomePage() {
  return (
    <div>
      <h2>Chào mừng bạn đến với EduForum!</h2>
      <p>
        <img src={yayJpg} width="388" />
      </p>
      <p>
        Để bắt đầu, hãy chỉnh sửa <code>pages/index.tsx</code> và lưu lại để cập nhật.
      </p>
    </div>
  );
}
