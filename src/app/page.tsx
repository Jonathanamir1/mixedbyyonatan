'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <main className='min-h-screen bg-white text-black'>
      <Header />

      {/* Hero Section */}
      <section className='flex items-center justify-center bg-white px-5 py-8 min-h-[calc(100vh-4rem)] md:min-h-screen md:px-6 lg:px-8'>
        <motion.div
          className='text-center max-w-6xl mx-auto w-full'
          variants={staggerContainer}
          initial='initial'
          animate='animate'
        >
          <motion.h1
            className='text-lg font-medium tracking-tight mb-8 leading-snug sm:text-xl sm:mb-10 md:text-2xl md:mb-12 lg:text-3xl xl:text-4xl'
            variants={fadeInUp}
          >
            I&apos;m offering a free professional mixdown to a few select artists each month.
          </motion.h1>

          <motion.p
            className='text-2xl font-bold leading-tight mb-8 sm:text-3xl md:text-4xl md:mb-10 lg:text-5xl lg:mb-12 xl:text-6xl 2xl:text-7xl'
            variants={fadeInUp}
          >
            I&apos;m not running a contest — I just want to work on music I truly believe in
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Link
              href={user ? '/submit' : '/login'}
              className='btn-primary inline-block w-full sm:w-auto'
            >
              Apply for a Free Mix
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* About Me Section */}
      <section className='flex items-center justify-center bg-white px-5 py-16 md:py-20 md:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto w-full'>
          <motion.div
            className='text-center mb-12 max-w-4xl mx-auto md:mb-16'
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl font-bold tracking-tight leading-tight mb-5 sm:text-4xl md:text-5xl md:mb-6 lg:text-6xl xl:text-7xl'>
              This is me.
            </h2>
            <p className='text-base text-gray-700 leading-relaxed sm:text-lg md:text-xl lg:text-2xl'>
              I&apos;m Yonatan Amir, and I&apos;ve spent years refining the art of music
              mixing. My approach isn&apos;t about following formulas—it&apos;s about
              listening deeply and bringing out what makes your music unique.
            </p>
          </motion.div>

          {/* Content with image */}
          <div className='relative max-w-5xl mx-auto'>
            <motion.div
              className='flex flex-col items-center gap-8 lg:flex-row lg:gap-16'
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              {/* Placeholder for Image */}
              <motion.div
                className='w-full max-w-sm lg:w-1/3 lg:max-w-none flex-shrink-0'
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className='aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center'>
                  <span className='text-gray-400 text-sm'>Your Image Here</span>
                </div>
              </motion.div>

              {/* Text content */}
              <motion.div
                className='flex-1 text-center space-y-5 lg:text-left lg:space-y-6'
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <p className='text-base text-gray-600 leading-relaxed sm:text-lg md:text-xl'>
                  Every track tells a story, and my job is to make sure yours is
                  heard exactly as you envision it. Whether it&apos;s finding the
                  perfect balance, adding depth, or creating space for every
                  element to shine.
                </p>
                <p className='text-xl font-bold text-black pt-2 sm:text-2xl md:text-3xl md:pt-4'>
                  Let&apos;s work together to create something special.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id='how-it-works'
        className='flex items-center justify-center bg-white px-5 py-16 md:py-20 md:px-6 lg:px-8'
      >
        <div className='max-w-7xl mx-auto w-full'>
          <motion.div
            className='text-center mb-12 max-w-4xl mx-auto md:mb-16'
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl font-bold tracking-tight leading-tight mb-5 sm:text-4xl md:text-5xl md:mb-6 lg:text-6xl xl:text-7xl'>
              How It Works
            </h2>
            <p className='text-base text-gray-700 leading-relaxed sm:text-lg md:text-xl lg:text-2xl'>
              Three simple steps to get your track professionally mixed
            </p>
          </motion.div>

          <div className='max-w-5xl mx-auto space-y-10 mb-12 md:space-y-14 md:mb-16'>
            {/* Step 1 */}
            <motion.div
              className='flex flex-col items-center gap-6 md:flex-row md:gap-10'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className='flex-shrink-0'>
                <div className='w-16 h-16 bg-black text-white rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg sm:w-20 sm:h-20 sm:text-3xl md:w-24 md:h-24 md:text-4xl'>
                  1
                </div>
              </div>
              <div className='flex-1 text-center md:text-left'>
                <h3 className='text-xl font-bold mb-3 sm:text-2xl md:text-3xl lg:text-4xl'>
                  Submit Your Track
                </h3>
                <p className='text-base text-gray-600 leading-relaxed sm:text-lg md:text-xl'>
                  Upload an MP3 or WAV and tell me a bit about your music and
                  vision.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className='flex flex-col items-center gap-6 md:flex-row md:gap-10'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className='flex-shrink-0'>
                <div className='w-16 h-16 bg-black text-white rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg sm:w-20 sm:h-20 sm:text-3xl md:w-24 md:h-24 md:text-4xl'>
                  2
                </div>
              </div>
              <div className='flex-1 text-center md:text-left'>
                <h3 className='text-xl font-bold mb-3 sm:text-2xl md:text-3xl lg:text-4xl'>
                  Selection
                </h3>
                <p className='text-base text-gray-600 leading-relaxed sm:text-lg md:text-xl'>
                  Each month, a few artists are chosen based on sound, potential,
                  and fit.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className='flex flex-col items-center gap-6 md:flex-row md:gap-10'
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className='flex-shrink-0'>
                <div className='w-16 h-16 bg-black text-white rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg sm:w-20 sm:h-20 sm:text-3xl md:w-24 md:h-24 md:text-4xl'>
                  3
                </div>
              </div>
              <div className='flex-1 text-center md:text-left'>
                <h3 className='text-xl font-bold mb-3 sm:text-2xl md:text-3xl lg:text-4xl'>
                  1-on-1 Call & Mixdown
                </h3>
                <p className='text-base text-gray-600 leading-relaxed sm:text-lg md:text-xl'>
                  We&apos;ll hop on a call to discuss your vision in depth, then I&apos;ll
                  get to work mixing your track to bring it to life.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            className='text-center pt-10 border-t border-gray-200 max-w-4xl mx-auto mt-12 md:pt-12 md:mt-16'
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className='text-lg text-gray-600 mb-8 md:text-xl lg:text-2xl md:mb-10'>
              No cost. No contest. Just collaboration.
            </p>
            <Link
              href={user ? '/submit' : '/login'}
              className='btn-primary inline-block w-full sm:w-auto'
            >
              Apply for a Free Mix
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Message CTA Section */}
      <section className='flex items-center justify-center bg-white px-5 py-16 min-h-[50vh] md:py-20 md:px-6 lg:px-8'>
        <motion.div
          className='text-center max-w-4xl mx-auto w-full'
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className='text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl'>
            Got a question? Log in and drop me a message — I&apos;ll get back to you soon.
          </p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
