import React from 'react';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import HeroSection from '@/app/components/HeroSection';
import CategoryShowcase from '@/app/components/CategoryShowcase';
import HowItWorks from '@/app/components/HowItWorks';
import FeaturedItems from '@/app/components/FeaturedItems';
import TestimonialsSection from '@/app/components/TestimonialsSection';
import LandingFooter from '@/app/components/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />
      <main>
        <HeroSection />
        <CategoryShowcase />
        <HowItWorks />
        <FeaturedItems />
        <TestimonialsSection />
      </main>
      <LandingFooter />
    </div>
  );
}