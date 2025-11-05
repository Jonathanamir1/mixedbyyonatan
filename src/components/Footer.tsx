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
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm md:text-sm tracking-wide text-center md:text-left">
            © 2024 Mixed by Yonatan Amir. All rights reserved.
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-8">
            <a
              href="https://www.instagram.com/jj.vst/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base md:text-sm tracking-wide uppercase hover:opacity-60 transition-opacity py-2 active:opacity-40"
            >
              Instagram
            </a>
            <a
              href="mailto:yonatanamir0@gmail.com"
              className="text-base md:text-sm tracking-wide uppercase hover:opacity-60 transition-opacity py-2 active:opacity-40"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
