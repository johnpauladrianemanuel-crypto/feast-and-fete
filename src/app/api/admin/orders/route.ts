import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendCancellationReason, getAvailableOrderStatuses } from '@/lib/orderWorkflow';

export const revalidate = 0; // Disable caching for live badge updates

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Shipped',
  'Completed',
  'Cancelled',
];

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key in environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] }, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled GET server error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { orderId, status, reason } = body;

    if (!orderId || typeof status !== 'string' || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const { data: currentOrder, error: currentOrderError } = await supabase
      .from('orders')
      .select('status, delivery_method, notes')
      .eq('id', orderId)
      .maybeSingle();

    if (currentOrderError) {
      console.error('Supabase order lookup error:', currentOrderError);
      return NextResponse.json({ error: currentOrderError.message }, { status: 500 });
    }
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const allowedStatuses = getAvailableOrderStatuses(
      currentOrder.delivery_method,
      currentOrder.status,
      ORDER_STATUSES
    );
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change order status from ${currentOrder.status} to ${status}` },
        { status: 409 }
      );
    }
    if (status === 'Cancelled' && (typeof reason !== 'string' || !reason.trim())) {
      return NextResponse.json(
        { error: 'A cancellation reason is required' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Cancelled' && typeof reason === 'string' && reason.trim()) {
      updatePayload.notes = appendCancellationReason(currentOrder.notes, reason);
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data }, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled PATCH server error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}