# Next.js

A modern Next.js 15 application built with TypeScript and Tailwind CSS.

## 🚀 Features

- **Next.js 15** - Latest version with improved performance and features
- **React 19** - Latest React version with enhanced capabilities
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

## 🛠️ Installation

1. Install dependencies:
  ```bash
  npm install
  # or
  yarn install
  ```

2. Start the development server:
  ```bash
  npm run dev
  # or
  yarn dev
  ```
3. Open [http://localhost:4028](http://localhost:4028) with your browser to see the result.

The development server uses `.next-dev` while production builds use `.next`, so running a build
does not overwrite a running development server's files. Restart the development server after
updating the configuration. If setting `DIST_DIR`, use different values for development and
production.

## 📁 Project Structure

```
nextjs/
├── public/             # Static assets
├── src/
│   ├── app/            # App router components
│   │   ├── layout.tsx  # Root layout component
│   │   └── page.tsx    # Main page component
│   ├── components/     # Reusable UI components
│   ├── styles/         # Global styles and Tailwind configuration
├── next.config.mjs     # Next.js configuration
├── package.json        # Project dependencies and scripts
├── postcss.config.js   # PostCSS configuration
└── tailwind.config.js  # Tailwind CSS configuration

```

## 🧩 Page Editing

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## 🎨 Styling

This project uses Tailwind CSS for styling with the following features:
- Utility-first approach for rapid development
- Custom theme configuration
- Responsive design utilities
- PostCSS and Autoprefixer integration

## 📦 Available Scripts

- `npm run dev` - Start development server on port 4028
- `npm run build` - Build the application for production
- `npm run start` - Start the development server
- `npm run serve` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## 📱 Deployment

Build the application for production:

  ```bash
  npm run build
  ```

### Checkout vouchers

Apply the Supabase migrations, including `20261109000000_order_vouchers.sql` and
`20261109000001_customer_discount.sql`, `20261109000002_claimed_vouchers.sql` and
`20261109000003_claim_vouchers_anytime.sql`, before
deploying the updated checkout. Signed-in
customers automatically receive 20% off the menu subtotal, with no expiry; delivery and
priority fees are not reduced by this automatic discount. The discount is rounded once on the
menu subtotal, so separately rounded unit prices can differ by a centavo.

Signed-in customers can instead use one of `FEAST20` (20%), `FETE30` (30%), or
`CELEBRATE50` (50%) per order. The voucher applies to the whole order, including delivery
and priority fees. The larger discount is used, not both; ties use the automatic discount.
Guests do not receive vouchers or discounts.

The promotions are valid daily from 8:00 AM inclusive to 5:00 PM exclusive, Philippine time,
from November 15 through December 24, 2026. Customers can claim a voucher on the menu at any
time, but can only use it during that window. Claimed vouchers are saved to the account and reusable
within that window; customers can see them under My Vouchers on their profile. There is no
minimum order or per-user usage limit.
The database checks eligibility and pricing again when the order is submitted, so customers
should submit before the daily closing time, including after paying a deposit.

### Dish reviews

Reviews submitted from completed orders are saved per menu item and displayed in the dish
details below the order note. Apply `20261109000004_fix_item_review_menu_id.sql` to create or
update the review table for the text-based menu item IDs before using this feature.

### Email notifications

Order update and new-menu announcement emails use Resend. Verify a sending domain in Resend, then
set these server-side environment variables in Vercel for each deployment environment:

- `RESEND_API_KEY` — the Resend API key.
- `RESEND_FROM_EMAIL` — a sender on the verified domain, for example
  `Feast & Fête <orders@your-verified-domain.com>`.
- `SUPABASE_SERVICE_ROLE_KEY` — the server-only Supabase service-role key, required to save global
  announcements and look up registered customer email addresses. Never expose this key in a
  `NEXT_PUBLIC_` variable.

The Resend test sender `onboarding@resend.dev` is restricted to verified test recipients and
cannot be used for arbitrary customer addresses. Menu announcements are visible to current and
future registered customers in the in-app notification bell. Announcement emails go to customer
accounts that exist when the menu item is added. Redeploy after changing the Vercel variables.

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by Next.js and React
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new