'use client';
import React from 'react';
import CustomerNotificationsContent from './CustomerNotificationsContent';
import NotificationsList from './NotificationsList';

export default function CustomerNotificationsPage() {
  return (
    <>
      <CustomerNotificationsContent />
      <NotificationsList />
    </>
  );
}
