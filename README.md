# 🚀 Meter Management System

Advanced web application for PBS meter data management with real-time syncing, offline caching, and load balancing.

## ✨ Features

- 🔐 **Secure Authentication** - PBSNet API Key based login
- 📊 **Google Sheets Integration** - Direct sync with Google Sheets
- 💾 **IndexedDB Caching** - Fast offline-first data access
- ⚖️ **Load Balancing** - Multiple Google Scripts for reliability
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🖨️ **Professional Printing** - Customizable print layouts
- 🔍 **Advanced Search** - Multi-field search capabilities
- 📈 **Real-time Updates** - Instant data synchronization

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Database:** Google Sheets (via Apps Script)
- **Cache:** IndexedDB (Browser)
- **Icons:** React Icons
- **Deployment:** Vercel

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd meter-management

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
