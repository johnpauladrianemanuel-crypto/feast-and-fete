import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

type AnnouncementRecord = {
  id: string;
  email_status: 'pending' | 'sent' | 'partial' | 'not_configured';
  email_sent_count: number;
};

type EmailUser = {
  email: string;
  name: string;
};

const EMAIL_BATCH_SIZE = 100;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Menu announcements require Supabase service-role configuration.');
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getCustomerEmails(
  supabase: ReturnType<typeof getServiceClient>
): Promise<EmailUser[]> {
  const customerIds: string[] = [];
  const profilePageSize = 1000;

  for (let offset = 0; ; offset += profilePageSize) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'customer')
      .order('id')
      .range(offset, offset + profilePageSize - 1);

    if (error) throw new Error(`Unable to load customer accounts: ${error.message}`);
    customerIds.push(...(data || []).map((profile) => profile.id));
    if (!data || data.length < profilePageSize) break;
  }

  if (customerIds.length === 0) return [];

  const customerIdSet = new Set(customerIds);
  const usersById = new Map<string, EmailUser>();
  const authPageSize = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: authPageSize,
    });

    if (error) throw new Error(`Unable to load customer email addresses: ${error.message}`);

    for (const user of data.users) {
      if (!customerIdSet.has(user.id) || !user.email) continue;
      usersById.set(user.id, {
        email: user.email,
        name: String(user.user_metadata?.full_name || user.user_metadata?.name || 'there'),
      });
    }

    if (data.users.length < authPageSize) break;
  }

  return [...usersById.entries()]
    .sort(([firstId], [secondId]) => firstId.localeCompare(secondId))
    .map(([, user]) => user);
}

function createMenuEmail(name: string, itemName: string, message: string, menuUrl: string) {
  const safeName = escapeHtml(name);
  const safeItemName = escapeHtml(itemName);
  const safeMessage = escapeHtml(message);
  const safeMenuUrl = escapeHtml(menuUrl);

  return {
    subject: `New on the Feast & Fête menu: ${itemName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#33251f;line-height:1.6">
        <h1 style="color:#a94725">A new menu item is here!</h1>
        <p>Hi ${safeName},</p>
        <p>${safeMessage}</p>
        <h2>${safeItemName}</h2>
        <p>Come and see what's new at Feast &amp; Fête.</p>
        <p><a href="${safeMenuUrl}" style="display:inline-block;background:#a94725;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">Explore the menu</a></p>
      </div>
    `,
  };
}

export async function POST(request: Request) {
  try {
    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!bearerToken) {
      return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !publishableKey) {
      return NextResponse.json({ error: 'Supabase authentication is not configured.' }, { status: 503 });
    }

    const authClient = createSupabaseClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(bearerToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in as an admin to announce menu items.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await authClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Unable to verify admin role for menu announcement:', profileError.message);
      return NextResponse.json({ error: 'Unable to verify admin access.' }, { status: 500 });
    }
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access is required.' }, { status: 403 });
    }

    const body = (await request.json()) as { menuItemId?: unknown };
    if (typeof body.menuItemId !== 'string' || !body.menuItemId.trim()) {
      return NextResponse.json({ error: 'A menu item ID is required.' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const { data: menuItem, error: menuItemError } = await serviceClient
      .from('menu_items')
      .select('id, name')
      .eq('id', body.menuItemId)
      .maybeSingle();

    if (menuItemError) {
      console.error('Unable to load menu item for announcement:', menuItemError.message);
      return NextResponse.json({ error: 'Unable to load the new menu item.' }, { status: 500 });
    }
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found.' }, { status: 404 });
    }

    const message = `A new menu item, ${menuItem.name}, has been added. Come and see what's new!`;
    let announcement: AnnouncementRecord | null = null;

    const { data: existingAnnouncement, error: existingError } = await serviceClient
      .from('menu_announcements')
      .select('id, email_status, email_sent_count')
      .eq('menu_item_id', menuItem.id)
      .maybeSingle();

    if (existingError) {
      console.error('Unable to check for an existing menu announcement:', existingError.message);
      return NextResponse.json({ error: 'Unable to create the menu announcement.' }, { status: 500 });
    }

    if (existingAnnouncement) {
      announcement = existingAnnouncement as AnnouncementRecord;
    } else {
      const { data: insertedAnnouncement, error: insertError } = await serviceClient
        .from('menu_announcements')
        .insert({
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name,
          message,
        })
        .select('id, email_status, email_sent_count')
        .single();

      if (insertError) {
        console.error('Unable to save menu announcement:', insertError.message);
        return NextResponse.json({ error: 'Unable to save the menu announcement.' }, { status: 500 });
      }
      announcement = insertedAnnouncement as AnnouncementRecord;
    }

    if (announcement.email_status === 'sent') {
      return NextResponse.json({
        announcementCreated: true,
        emailSent: announcement.email_sent_count,
        emailFailed: 0,
      });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!fromEmail || !resendApiKey) {
      const { error } = await serviceClient
        .from('menu_announcements')
        .update({ email_status: 'not_configured', email_error: 'Resend sender or API key is not configured.' })
        .eq('id', announcement.id);
      if (error) console.error('Unable to record missing email configuration:', error.message);

      return NextResponse.json({
        announcementCreated: true,
        emailSent: 0,
        emailFailed: 0,
        warning: 'The in-app notice is live, but email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
      });
    }

    const customers = await getCustomerEmails(serviceClient);
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
    const menuUrl = `${baseUrl}/menu-browse-screen`;
    const resend = new Resend(resendApiKey);
    let emailSent = 0;
    let emailFailed = 0;
    const errors: string[] = [];

    for (let offset = 0; offset < customers.length; offset += EMAIL_BATCH_SIZE) {
      const batchCustomers = customers.slice(offset, offset + EMAIL_BATCH_SIZE);
      const batch = batchCustomers.map((customer) => {
        const email = createMenuEmail(customer.name, menuItem.name, message, menuUrl);
        return {
          from: fromEmail,
          to: customer.email,
          subject: email.subject,
          html: email.html,
        };
      });
      const batchKey = createHash('sha256')
        .update(`${announcement.id}:${batchCustomers.map((customer) => customer.email).join(',')}`)
        .digest('hex');

      const { data, error } = await resend.batch.send(batch, {
        idempotencyKey: `menu-announcement-${batchKey}`,
      });

      if (error) {
        emailFailed += batch.length;
        errors.push(error.message);
      } else {
        emailSent += data?.data.length ?? batch.length;
      }
    }

    const emailStatus = emailFailed === 0 ? 'sent' : 'partial';
    const { error: updateError } = await serviceClient
      .from('menu_announcements')
      .update({
        email_status: emailStatus,
        email_sent_count: emailSent,
        email_error: errors.length > 0 ? errors.join('; ').slice(0, 2000) : null,
      })
      .eq('id', announcement.id);

    if (updateError) {
      console.error('Unable to save menu announcement email results:', updateError.message);
      return NextResponse.json(
        { error: 'Announcement was created, but email delivery results could not be saved.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      announcementCreated: true,
      emailSent,
      emailFailed,
      warning:
        emailFailed > 0
          ? `The in-app notice is live, but email could not be delivered to ${emailFailed} customer(s).`
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected announcement error.';
    console.error('Failed to publish menu announcement:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
