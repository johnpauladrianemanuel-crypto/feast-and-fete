import React from 'react';
import CustomerNavbar from '@/components/CustomerNavbar';
import CartDrawer from '@/components/CartDrawer';
import MenuBrowseContent from '@/app/menu-browse-screen/components/MenuBrowseContent';

export default function MenuBrowsePage() {
  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <CartDrawer />
      <MenuBrowseContent />
    </div>
  );
}