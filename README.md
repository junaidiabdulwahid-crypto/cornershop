# CornerShop

Find shops near you and redeem their offers right at the counter.

A full-stack app built with **NestJS + TypeScript**, **PostgreSQL + PostGIS** and **Next.js**. It is the companion project of my book *Full-Stack From Zero*, where every part of this code is explained line by line.

## What it does

- **Shops nearby**: PostGIS `ST_DWithin` / `ST_Distance` on a GiST-indexed `geography` column, nearest first.
- **Offers with a daily limit**: only the shop owner can add them (403 for anyone else).
- **Redeem at the counter**: the customer must be within 100 m of the shop, and the daily limit counts from midnight IST.
- **Exact money**: rupees stored as `NUMERIC(12,2)`, all maths in whole paise. 10% off ₹480.75 is ₹48.08, so the customer pays ₹432.67.
- **No double-spending the last slot**: redemption locks the offer row (`SELECT … FOR UPDATE`). Five customers at once with two slots left → exactly two succeed.
- **Reviews**: 1–5 stars, one per person per shop (enforced by `UNIQUE` + `ON CONFLICT DO NOTHING` → clean 409), and owners can't review themselves.
- **Audit log**: every change writes an audit row in the same transaction.
- **One error shape**: `{ statusCode, message, path, timestamp }`, with no stack traces or SQL leaking in a 500.

## Stack

| Layer | Tech |
| --- | --- |
| API | NestJS 11, TypeORM, class-validator, JWT |
| Database | PostgreSQL 16 + PostGIS |
| Web | Next.js 15 (App Router), React 19 |
| Tests | Jest (unit), `demo.sh` (every route against a running API) |
| CI | GitHub Actions: typecheck, test and build on every push |

## Run it

```bash
docker compose up -d                       # PostgreSQL + PostGIS on :5433, loads db/*.sql on first start

cd api
cp ../.env.example .env                    # set JWT_SECRET (openssl rand -hex 32)
pnpm install && pnpm build
pnpm start                                 # API on http://localhost:3100/api/v1

cd ../web
pnpm install && pnpm dev                   # web on http://localhost:3001

./demo.sh                                  # every route, including the race test
```

Sign in with any Indian number and the demo code `000000` (a real app would send an SMS OTP).

## API

All paths start with `/api/v1`.

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Phone + code → JWT |
| POST | `/shops` | JWT | Create a shop |
| GET | `/shops/nearby?lat&lng&radius_m` | public | Shops within 100–10,000 m (default 2,000) |
| GET | `/shops/:id` | public | One shop |
| POST | `/shops/:id/offers` | JWT (owner) | Add an offer |
| GET | `/shops/:id/offers` | public | Offers, with today's usage |
| POST | `/offers/:id/redeem` | JWT | Redeem at the counter → receipt |
| POST | `/shops/:id/reviews` | JWT | Review a shop |
| GET | `/shops/:id/reviews` | public | `{ average_rating, count, reviews }` |
| GET | `/health` | public | Database check |

## Project layout

```
db/            001_init.sql (5 tables), 002_reviews.sql
api/src/       auth/ shops/ offers/ reviews/ audit/ common/ (money, IST day, error filter)
web/app/       home (nearby), login, shops/[id] (offers, redeem, reviews)
demo.sh        the whole story with curl
```

## Tests

```bash
cd api && pnpm typecheck && pnpm test      # money maths, IST day, offer and review rules
```
