'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      className="bg-black text-white py-16"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Copyright */}
          <div className="text-sm tracking-wide mb-6 md:mb-0">
            © 2024 Mixed by Yonatan Amir. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://www.instagram.com/jj.vst/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Instagram
            </a>
            <a
              href="mailto:yonatanamir0@gmail.com"
              className="text-sm tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
