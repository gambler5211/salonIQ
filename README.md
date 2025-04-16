# SalonIQ - Salon Client Retention Platform

SalonIQ is a comprehensive client management and retention platform designed specifically for salons and beauty businesses. It helps salon owners automate client follow-ups, track customer visits, and boost repeat business through WhatsApp reminders.

## Features

- **Customer Management**: Track customer details, service history, and preferences
- **Automated Campaigns**: Set up automated reminder campaigns based on client visit history
- **WhatsApp Integration**: Send automated reminders directly through WhatsApp
- **Analytics Dashboard**: View key metrics on client retention and campaign performance
- **Service Tracking**: Record customer services with detailed notes and history
- **Mobile Responsive**: Full functionality on both desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Messaging**: WhatsApp Business API
- **Styling**: Shadcn/UI components

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Firebase account
- WhatsApp Business API access (for sending messages)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/salon-retargeting.git
   cd salon-retargeting
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For inquiries, please contact [your-email@example.com](mailto:your-email@example.com)
