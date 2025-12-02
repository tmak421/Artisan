# Artisan Apparel Backend

E-commerce backend API for Artisan Apparel - a sustainable fashion brand accepting cryptocurrency payments.

**Legal Entity:** Artisan Bitcoin Inc. (DBA Artisan Apparel)

## Features

- 🔐 **Cryptocurrency Payments** - Accept Decred, Bitcoin, and Monero
- 🏭 **Print-on-Demand** - Automated Printful integration
- 💱 **Auto-Conversion** - Convert crypto to USD via Kraken
- 📧 **Email Notifications** - SendGrid integration
- ⭐ **Review System** - Verified purchase reviews with moderation
- 🔗 **Webhook Support** - Real-time updates from payment processors

## Tech Stack

- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Database:** PostgreSQL 15.x
- **ORM:** Sequelize
- **Payment Processors:** dcrwallet RPC, BTCPay Server, Coinbase Commerce
- **Exchange:** Kraken API
- **Fulfillment:** Printful API
- **Email:** SendGrid

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15.x
- Decred wallet (for DCR payments)
- API keys for Printful, SendGrid, Kraken

### Installation

```bash
# Clone the repository
git clone https://github.com/artisan-apparel/backend.git
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Production Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name artisan-backend

# Save PM2 config
pm2 save
pm2 startup
```

## API Endpoints

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/create` | Create new order |
| GET | `/api/orders/:orderId` | Get order status |
| GET | `/api/orders` | List orders (admin) |
| POST | `/api/orders/:orderId/cancel` | Cancel order (admin) |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rates/:crypto` | Get exchange rate |
| GET | `/api/payments/:orderId/status` | Check payment status |
| POST | `/api/payments/:orderId/verify` | Verify payment (admin) |
| GET | `/api/payments/balances` | Get wallet balances (admin) |
| POST | `/api/payments/convert` | Convert crypto to USD (admin) |
| POST | `/api/payments/withdraw` | Withdraw to bank (admin) |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/submit` | Submit a review |
| GET | `/api/reviews/:productId` | Get product reviews |
| POST | `/api/reviews/:reviewId/helpful` | Mark review helpful |
| POST | `/api/reviews/:reviewId/report` | Report a review |
| GET | `/api/reviews/admin/pending` | List pending reviews (admin) |
| POST | `/api/reviews/admin/:reviewId/moderate` | Moderate review (admin) |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/payment-confirmed` | Internal payment webhook |
| POST | `/api/webhooks/printful` | Printful order updates |
| POST | `/api/webhooks/btcpay` | BTCPay payment updates |
| POST | `/api/webhooks/coinbase` | Coinbase Commerce updates |
| GET | `/api/webhooks/health` | Webhook health check |

## Order Flow

```
1. Customer → Create Order → Generate Payment Address
2. Customer → Send Crypto → Blockchain Confirmation
3. System → Detect Payment → Update Order Status
4. System → Create Printful Order → Production
5. Printful → Ship Order → Send Tracking Email
6. Customer → Receive Order → Submit Review
```

## Configuration

See `.env.example` for all configuration options. Key settings:

| Variable | Description |
|----------|-------------|
| `DB_*` | PostgreSQL connection settings |
| `DCR_RPC_*` | Decred wallet RPC credentials |
| `PRINTFUL_API_KEY` | Printful API key |
| `SENDGRID_API_KEY` | SendGrid email API key |
| `KRAKEN_API_*` | Kraken exchange credentials |
| `WEBHOOK_SECRET` | Secret for webhook validation |

## Development

```bash
# Run tests
npm test

# Run linter
npm run lint

# Development with auto-reload
npm run dev
```

## Project Structure

```
artisan-apparel-backend/
├── src/
│   ├── config/          # Configuration (env, database)
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── services/        # External service integrations
│   └── utils/           # Helper functions
├── migrations/          # Database migrations
├── tests/               # Test files
├── server.js            # Application entry point
└── package.json
```

## Security

- All webhooks require signature verification
- Admin endpoints require API key authentication
- Rate limiting enabled on all public endpoints
- Helmet.js for security headers
- Input validation on all routes

## Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- `logs/exceptions.log` - Uncaught exceptions

Use PM2 for process monitoring in production.

## License

Proprietary - Artisan Bitcoin Inc.

## Support

For issues or questions, contact: dev@artisanapparel.com
