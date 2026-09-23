# Technical Specification — Pencatatan Operasional Usaha

| Field | Value |
|---|---|
| Versi | 1.4 |
| Status | Living document — selaras BRD v1.3 & codebase |
| BRD Reference | [BRD.md](./BRD.md) v1.3 |
| Arsitektur | React SPA + Go REST API + MySQL 8 (Redis rencana) |

---

## 1. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| **Frontend** | **React 19** + **Vite 8** | SPA modern, web responsive |
| FE Language | **TypeScript** | Type safety |
| FE Routing | **React Router 7** | Client-side routing |
| FE Data Fetching | **fetch** (`api/client.ts`) | TanStack Query **belum** |
| FE UI | **Tailwind CSS 4 + shadcn-style** | Responsive components |
| FE Forms | Controlled inputs | React Hook Form + Zod **belum** |
| FE HTTP Client | **fetch wrapper** | JWT + `X-Workspace-ID` |
| **Backend** | **Go 1.26** | Performa, deploy ringan |
| API Framework | **Fiber v2** | REST API (spec awal Gin) |
| BE ORM | **database/sql** + SQL migrations | GORM **belum** |
| BE Validation | Handler-level | go-playground/validator **belum** |
| BE Auth | **JWT** (golang-jwt) + bcrypt | Logout blacklist Redis **belum** |
| **Database** | **MySQL 8.4** | Primary DB (spec awal MariaDB) |
| **Cache** | — | Redis **belum** |
| Migration | **embed SQL** (`internal/migrate`) | golang-migrate CLI **belum** |
| Deploy | **Docker Compose** | mysql + api + frontend (nginx) |

---

## 2. Arsitektur

```
┌──────────────────────────────────────────────────────────┐
│                   Browser (Mobile/Desktop)                │
│         React SPA (Vite) — port 5173 / nginx :80         │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / REST JSON
                         │ Header: Authorization: Bearer <JWT>
                         │ Header: X-Workspace-ID: <uuid>
┌────────────────────────▼─────────────────────────────────┐
│                   Go API Server (Gin)                     │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │Middleware│  │  Handlers  │  │   Service Layer       │ │
│  │ JWT      │  │  /api/v1/* │  │   (core atoms)        │ │
│  │ Workspace│  └─────┬──────┘  └──────────┬────────────┘ │
│  └──────────┘        │                    │              │
│                      │         ┌──────────▼────────────┐ │
│                      │         │  Repository Layer     │ │
│                      │         └──────────┬────────────┘ │
└──────────────────────┼────────────────────┼──────────────┘
                       │                    │
          ┌────────────▼──────┐   ┌────────▼────────┐
          │   Redis 7          │   │  MariaDB 11     │
          │   Cache + Session  │   │  Primary DB     │
          └───────────────────┘   └─────────────────┘
```

### Prinsip Atomic

1. **Core atoms** (`backend/internal/core/`) — business logic generic, tidak tahu "lele"
2. **Templates** (`frontend/src/templates/`) — konfigurasi UI per jenis usaha
3. **Semua query scoped** ke `workspace_id` via middleware
4. **Extension via enum + JSON**, bukan inheritance class
5. **Cache di Redis** — invalidate on write, bukan cache-aside manual di FE

### Selaras BRD v1.1

Aturan bisnis lengkap: [BRD.md §9–§14](./BRD.md).

| Topik | Implementasi |
|---|---|
| Transaction types MVP | `PURCHASE`, `RENT_PAYMENT`, `PROFIT_SHARE_PAYOUT`, `OTHER_EXPENSE`; personal + `OTHER_INCOME`. **`FEED_PURCHASE` tidak dipakai.** |
| Pembelian | 1 Transaction : N PurchaseLineItem; amount = SUM line items |
| Histori harga | Field `item_name_normalized` (lowercase+trim) |
| Kontrak sewa | Status waktu + status bayar — derived on-read |
| Bagi hasil | Max 2 pihak; persen total = 100% |
| ConsumableLot | Link ke purchase opsional; manual allowed |
| Anti double-count | Laporan sewa by kontrak; bagi hasil by record |
| WaterQualityLog (T2) | Atom observasional; no Transaction; ambang & saran dari konfigurasi kolam; template workspace untuk kolam baru |

---

## 3. Project Structure (Monorepo)

```
pencatatan-usaha/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                    # axios client + endpoint functions
│   │   │   ├── client.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── workspace.api.ts
│   │   │   ├── pond.api.ts
│   │   │   ├── purchase.api.ts
│   │   │   ├── feed.api.ts
│   │   │   ├── rent.api.ts
│   │   │   ├── distribution.api.ts
│   │   │   ├── water-quality.api.ts
│   │   │   └── report.api.ts
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn
│   │   │   └── shared/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useWorkspace.ts
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx       # sidebar + workspace switcher
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ponds/
│   │   │   ├── water-quality/
│   │   │   ├── purchases/
│   │   │   ├── feed/
│   │   │   ├── rent/
│   │   │   ├── profit-share/
│   │   │   ├── reports/
│   │   │   ├── personal/
│   │   │   └── settings/
│   │   ├── templates/
│   │   │   ├── lele/config.ts
│   │   │   └── personal/config.ts
│   │   ├── stores/
│   │   │   └── workspace.store.ts  # zustand — active workspace
│   │   ├── types/                  # TS types mirroring API response
│   │   └── lib/
│   │       └── utils.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go             # entry point
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go
│   │   ├── middleware/
│   │   │   ├── auth.go             # JWT validation
│   │   │   ├── workspace.go        # X-Workspace-ID validation
│   │   │   └── cors.go
│   │   ├── handler/                # HTTP handlers (thin)
│   │   │   ├── auth_handler.go
│   │   │   ├── workspace_handler.go
│   │   │   ├── pond_handler.go
│   │   │   ├── purchase_handler.go
│   │   │   ├── feed_handler.go
│   │   │   ├── rent_handler.go
│   │   │   ├── distribution_handler.go
│   │   │   ├── water_quality_handler.go
│   │   │   ├── report_handler.go
│   │   │   └── dashboard_handler.go
│   │   ├── service/                # business logic (core atoms)
│   │   │   ├── auth_service.go
│   │   │   ├── workspace_service.go
│   │   │   ├── transaction_service.go
│   │   │   ├── purchase_service.go
│   │   │   ├── contract_service.go
│   │   │   ├── consumable_service.go
│   │   │   ├── distribution_service.go
│   │   │   ├── water_quality_service.go
│   │   │   └── report_service.go
│   │   ├── repository/             # GORM queries
│   │   │   ├── user_repo.go
│   │   │   ├── workspace_repo.go
│   │   │   └── ...
│   │   ├── model/                  # GORM models
│   │   │   ├── user.go
│   │   │   ├── workspace.go
│   │   │   └── ...
│   │   ├── dto/                    # request/response structs
│   │   │   ├── request/
│   │   │   └── response/
│   │   └── cache/
│   │       └── redis.go            # cache helper + key patterns
│   ├── migrations/                 # SQL files (golang-migrate)
│   │   ├── 000001_init.up.sql
│   │   ├── 000001_init.down.sql
│   │   ├── 000002_water_quality_logs.up.sql   # T2
│   │   └── 000002_water_quality_logs.down.sql # T2
│   ├── go.mod
│   └── go.sum
│
├── docker-compose.yml
├── .env.example
├── BRD.md
├── TECHNICAL_SPEC.md
└── README.md
```

---

## 4. Database Schema (MariaDB)

### Migration: `000001_init.up.sql`

```sql
-- ─── Auth ───────────────────────────────────────────

CREATE TABLE users (
    id            CHAR(36)     PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Workspace Atom ─────────────────────────────────

CREATE TABLE workspaces (
    id          CHAR(36)                          PRIMARY KEY,
    user_id     CHAR(36)                          NOT NULL,
    name        VARCHAR(255)                      NOT NULL,
    type        ENUM('BUSINESS','PERSONAL')       NOT NULL DEFAULT 'BUSINESS',
    template_id VARCHAR(50)                       NOT NULL DEFAULT 'lele',
    created_at  DATETIME(3)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workspaces_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Cash Account ───────────────────────────────────

CREATE TABLE cash_accounts (
    id           CHAR(36)     PRIMARY KEY,
    workspace_id CHAR(36)     NOT NULL,
    name         VARCHAR(255) NOT NULL,
    is_default   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_cash_accounts_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── BusinessUnit Atom ──────────────────────────────

CREATE TABLE business_units (
    id           CHAR(36)                        PRIMARY KEY,
    workspace_id CHAR(36)                        NOT NULL,
    unit_type    ENUM('POND')                    NOT NULL DEFAULT 'POND',
    name         VARCHAR(255)                    NOT NULL,
    location     VARCHAR(255),
    size         VARCHAR(100),
    owner_name   VARCHAR(255),
    status       ENUM('ACTIVE','INACTIVE')       NOT NULL DEFAULT 'ACTIVE',
    notes        TEXT,
    created_at   DATETIME(3)                     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at   DATETIME(3)                     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_business_units_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Batch (metadata extension) ─────────────────────

CREATE TABLE batches (
    id               CHAR(36)     PRIMARY KEY,
    workspace_id     CHAR(36)     NOT NULL,
    business_unit_id CHAR(36),
    name             VARCHAR(255) NOT NULL,
    start_date       DATE,
    end_date         DATE,
    status           ENUM('ACTIVE','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    notes            TEXT,
    created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
    INDEX idx_batches_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Transaction Atom ───────────────────────────────

CREATE TABLE transactions (
    id               CHAR(36)     PRIMARY KEY,
    workspace_id     CHAR(36)     NOT NULL,
    cash_account_id  CHAR(36)     NOT NULL,
    transaction_type ENUM('PURCHASE','RENT_PAYMENT','FEED_PURCHASE','PROFIT_SHARE_PAYOUT','OTHER_EXPENSE','OTHER_INCOME') NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,
    transaction_date DATE          NOT NULL,
    description      TEXT,
    business_unit_id CHAR(36),
    batch_id         CHAR(36),
    category         VARCHAR(100),
    created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (cash_account_id) REFERENCES cash_accounts(id),
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_transactions_workspace_date (workspace_id, transaction_date),
    INDEX idx_transactions_workspace_type (workspace_id, transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PurchaseLineItem Atom ──────────────────────────

CREATE TABLE purchase_line_items (
    id                    CHAR(36)     PRIMARY KEY,
    transaction_id        CHAR(36)     NOT NULL,
    item_name             VARCHAR(255) NOT NULL,
    item_name_normalized  VARCHAR(255) NOT NULL,
    category              ENUM('FEED','TOOL','MEDICINE','MAINTENANCE','SUPPLY','OTHER') NOT NULL DEFAULT 'OTHER',
    qty                   DECIMAL(10,2) NOT NULL,
    unit                  VARCHAR(50)  NOT NULL,
    unit_price            DECIMAL(15,2) NOT NULL,
    total_price           DECIMAL(15,2) NOT NULL,
    supplier_name         VARCHAR(255),
    notes                 TEXT,
    created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_purchase_items_transaction (transaction_id),
    INDEX idx_purchase_items_normalized (item_name_normalized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PeriodicContract Atom ──────────────────────────

CREATE TABLE periodic_contracts (
    id                 CHAR(36)     PRIMARY KEY,
    workspace_id       CHAR(36)     NOT NULL,
    business_unit_id   CHAR(36)     NOT NULL,
    start_date         DATE         NOT NULL,
    end_date           DATE         NOT NULL,
    duration_months    INT          NOT NULL,
    total_amount       DECIMAL(15,2) NOT NULL,
    payment_scheme     ENUM('LUMP_SUM','INSTALLMENT') NOT NULL,
    monthly_equivalent DECIMAL(15,2) NOT NULL,
    status             ENUM('ACTIVE','EXPIRING','ENDED') NOT NULL DEFAULT 'ACTIVE',
    notes              TEXT,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
    INDEX idx_contracts_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PaymentSchedule ────────────────────────────────

CREATE TABLE payment_schedules (
    id          CHAR(36)     PRIMARY KEY,
    contract_id CHAR(36)     NOT NULL,
    due_date    DATE         NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    is_paid     TINYINT(1)   NOT NULL DEFAULT 0,
    paid_at     DATETIME(3),
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (contract_id) REFERENCES periodic_contracts(id) ON DELETE CASCADE,
    INDEX idx_schedules_contract (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ContractPayment Atom ───────────────────────────

CREATE TABLE contract_payments (
    id             CHAR(36)     PRIMARY KEY,
    schedule_id    CHAR(36)     NOT NULL UNIQUE,
    transaction_id CHAR(36)     NOT NULL UNIQUE,
    amount         DECIMAL(15,2) NOT NULL,
    payment_date   DATE         NOT NULL,
    notes          TEXT,
    created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (schedule_id) REFERENCES payment_schedules(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ConsumableLot Atom ─────────────────────────────

CREATE TABLE consumable_lots (
    id                 CHAR(36)     PRIMARY KEY,
    workspace_id       CHAR(36)     NOT NULL,
    transaction_id     CHAR(36)     UNIQUE,
    lot_type           ENUM('FEED') NOT NULL DEFAULT 'FEED',
    name               VARCHAR(255) NOT NULL,
    brand              VARCHAR(255),
    qty_bags           DECIMAL(10,2),
    total_kg           DECIMAL(10,2),
    total_cost         DECIMAL(15,2) NOT NULL,
    purchase_date      DATE         NOT NULL,
    business_unit_id   CHAR(36),
    batch_id           CHAR(36),
    start_use_date     DATE,
    estimated_end_date DATE,
    actual_end_date    DATE,
    status             ENUM('ACTIVE','DEPLETED') NOT NULL DEFAULT 'ACTIVE',
    notes              TEXT,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_consumable_workspace_status (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Distribution Atom ──────────────────────────────

CREATE TABLE distribution_schemes (
    id               CHAR(36)     PRIMARY KEY,
    workspace_id     CHAR(36)     NOT NULL,
    name             VARCHAR(255) NOT NULL,
    base_type        ENUM('NET_PROFIT','REVENUE','FIXED') NOT NULL,
    parties          JSON         NOT NULL,
    business_unit_id CHAR(36),
    batch_id         CHAR(36),
    status           ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_distribution_schemes_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE distribution_records (
    id              CHAR(36)     PRIMARY KEY,
    scheme_id       CHAR(36)     NOT NULL,
    period_start    DATE         NOT NULL,
    period_end      DATE         NOT NULL,
    gross_result    DECIMAL(15,2) NOT NULL,
    total_cost      DECIMAL(15,2) NOT NULL,
    net_result      DECIMAL(15,2) NOT NULL,
    party_amounts   JSON         NOT NULL,
    payment_status  ENUM('UNPAID','PAID') NOT NULL DEFAULT 'UNPAID',
    payment_date    DATE,
    transaction_id  CHAR(36)     UNIQUE,
    notes           TEXT,
    created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (scheme_id) REFERENCES distribution_schemes(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_distribution_records_scheme (scheme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── WaterQualityLog Atom (T2) ──────────────────────

CREATE TABLE water_quality_logs (
    id                 CHAR(36)     PRIMARY KEY,
    workspace_id       CHAR(36)     NOT NULL,
    business_unit_id   CHAR(36)     NOT NULL,
    batch_id           CHAR(36),
    measured_at        DATETIME(3)  NOT NULL,
    ammonia_ppm        DECIMAL(6,3),
    ph                 DECIMAL(4,2),
    notes              TEXT,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    INDEX idx_wq_logs_workspace_measured (workspace_id, measured_at),
    INDEX idx_wq_logs_business_unit (business_unit_id, measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### GORM Model Example

```go
// backend/internal/model/workspace.go
type Workspace struct {
    ID         string        `gorm:"type:char(36);primaryKey" json:"id"`
    UserID     string        `gorm:"type:char(36);not null;index" json:"userId"`
    Name       string        `gorm:"size:255;not null" json:"name"`
    Type       WorkspaceType `gorm:"type:enum('BUSINESS','PERSONAL');default:'BUSINESS'" json:"type"`
    TemplateID string        `gorm:"size:50;default:'lele'" json:"templateId"`
    CreatedAt  time.Time     `json:"createdAt"`
    UpdatedAt  time.Time     `json:"updatedAt"`
}

type WorkspaceType string
const (
    WorkspaceBusiness WorkspaceType = "BUSINESS"
    WorkspacePersonal WorkspaceType = "PERSONAL"
)
```

---

## 5. REST API Design

Base URL: `/api/v1`

### Konvensi Response

```go
// Success
{ "success": true, "data": { ... } }

// Success with pagination
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 50, "total": 120 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Headers

| Header | Required | Keterangan |
|---|---|---|
| `Authorization` | Ya (kecuali auth) | `Bearer <JWT>` |
| `X-Workspace-ID` | Ya (kecuali workspace list) | UUID workspace aktif |
| `Content-Type` | Ya (POST/PUT) | `application/json` |

---

### 5.1 Auth

| Method | Endpoint | Body | Response | Status repo |
|---|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, expiresAt, user }` | ✅ |
| POST | `/auth/logout` | — | `{ message }` | ✅ (no Redis blacklist) |
| GET | `/auth/me` | — | `{ user }` | ✅ |

### 5.1b Users (ADMIN)

| Method | Endpoint | Status repo |
|---|---|---|
| GET/POST | `/users` | ✅ |
| GET/PUT/DELETE | `/users/:id` | ✅ |
| PUT | `/users/:id/reset-password` | ✅ |

### 5.2 Workspace

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/workspaces` | — | `[Workspace]` |
| POST | `/workspaces` | `{ name, type, templateId? }` | `Workspace` + auto CashAccount |
| PUT | `/workspaces/:id` | `{ name }` | `Workspace` |
| DELETE | `/workspaces/:id` | — | `204` |

### 5.3 BusinessUnit (Kolam)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/ponds` | `?status=ACTIVE` | `[BusinessUnit]` |
| GET | `/ponds/:id` | — | `BusinessUnit` |
| POST | `/ponds` | `{ name, location?, size?, ownerName?, notes? }` | `BusinessUnit` |
| PUT | `/ponds/:id` | `{ ...fields }` | `BusinessUnit` |
| DELETE | `/ponds/:id` | — | `204` | ✅ **Admin only** |

### 5.4 Batch

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/batches` | `?businessUnitId=&status=` | `[Batch]` |
| POST | `/batches` | `{ name, businessUnitId?, startDate?, endDate? }` | `Batch` |
| PUT | `/batches/:id` | `{ ...fields }` | `Batch` |

### 5.5 Purchase (Transaction + LineItems)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/purchases` | `?from=&to=&businessUnitId=&page=&limit=` | `[Transaction]` with items |
| POST | `/purchases` | `{ date, cashAccountId, businessUnitId?, batchId?, description?, items[] }` — **1..N items** | `{ transaction, items[], consumablePrompts[] }` |
| POST | `/transactions/personal` | `{ date, amount, type: OTHER_EXPENSE\|OTHER_INCOME, category, description? }` | `Transaction` |

**PurchaseItem request:**
```json
{
  "itemName": "PF1000",
  "category": "FEED",
  "qty": 3,
  "unit": "karung",
  "unitPrice": 350000,
  "supplierName": "Toko Pakan Jaya"
}
```

### 5.6 ConsumableLot (Pakan)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/feed-lots` | `?status=ACTIVE&businessUnitId=` | `[ConsumableLot]` |
| GET | `/feed-lots/:id` | — | `ConsumableLot` |
| POST | `/feed-lots` | `{ transactionId?, name, brand?, qtyBags?, totalKg?, totalCost, purchaseDate, businessUnitId?, batchId? }` | `ConsumableLot` |
| PUT | `/feed-lots/:id/usage` | `{ startUseDate, estimatedEndDate? }` | `ConsumableLot` |
| PUT | `/feed-lots/:id/deplete` | `{ actualEndDate }` | `ConsumableLot` |

### 5.7 Rent Contract (Sewa)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/rent-contracts` | `?status=` | `[PeriodicContract]` with schedules |
| GET | `/rent-contracts/:id` | — | contract + schedules + payments |
| POST | `/rent-contracts` | `{ businessUnitId, startDate, durationMonths, totalAmount, paymentScheme, notes? }` | `{ contract, schedules[] }` |
| POST | `/rent-contracts/schedules/:id/pay` | `{ paymentDate, cashAccountId }` | `{ payment, transaction }` |

### 5.8 Distribution (Bagi Hasil)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/distribution-schemes` | — | `[DistributionScheme]` |
| POST | `/distribution-schemes` | `{ name, baseType, parties[2], businessUnitId?, batchId? }` — **max 2 pihak, persen total=100** | `DistributionScheme` |
| GET | `/distribution-records` | `?schemeId=&paymentStatus=` | `[DistributionRecord]` |
| POST | `/distribution-records` | `{ schemeId, periodStart, periodEnd, grossResult, totalCost }` | `DistributionRecord` (auto-calc) |
| POST | `/distribution-records/:id/pay` | `{ partyIndex, paymentDate, cashAccountId }` — **1 transaction per pihak** | `{ record, transaction }` |

### 5.9 WaterQualityLog (T2 — Kualitas Air)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/water-quality-logs` | `?businessUnitId=&batchId=&from=&to=&page=&limit=` | `[WaterQualityLog]` with status badge |
| GET | `/water-quality-logs/:id` | — | `WaterQualityLog` |
| POST | `/water-quality-logs` | `{ businessUnitId, batchId?, measuredAt, ammoniaPpm?, ph?, notes? }` — **min 1 of ammoniaPpm/ph/notes** | `WaterQualityLog` |
| PUT | `/water-quality-logs/:id` | `{ ...fields }` | `WaterQualityLog` |
| DELETE | `/water-quality-logs/:id` | — | `204` | ✅ **Admin only** |
| GET | `/water-quality/config` | — | `WaterQualityConfig` (threshold + teks saran) |
| PUT | `/water-quality/config` | `WaterQualityConfig` | `WaterQualityConfig` | ✅ **Admin only** |
| POST | `/water-quality/evaluate` | `{ businessUnitId, ammoniaPpm?, ph? }` | `{ status, advice[] }` dari config kolam |
| GET | `/water-quality-logs/trends` | `?businessUnitId=&days=7\|30` | `{ series: { ammonia[], ph[] }, measuredAt[] }` |

**Validation (server):**
- Reject if kolam status = `INACTIVE`
- Reject if all of `ammoniaPpm`, `ph`, `notes` empty
- Compute `status` dan `advice` dari `business_units.water_quality_config` kolam yang diukur (BR-F7, BR-F12)
- `GET/PUT /water-quality/config` adalah **template** kolam baru (`workspace_settings`, key `water_quality_config`). Mengubah template tidak menulis ulang kolam yang sudah ada
- `POST/PUT /ponds` menerima `waterQualityConfig` opsional. Create tanpa field menyalin template. Update tanpa field mempertahankan config lama

**`WaterQualityConfig`** (disimpan per kolam; template workspace di-merge dengan default jika field kosong):

| Field | Default | Peran |
|---|---|---|
| `ammoniaWarnPpm` | 0.5 | ≥ nilai ini → `WARNING` |
| `ammoniaDangerPpm` | 1.0 | ≥ nilai ini → `DANGER` (harus ≥ waspada) |
| `phMinNormal` / `phMaxNormal` | 6.5 / 8.5 | di luar rentang → `WARNING` saja |
| `ammoniaAnalyteNote` | catatan kit TAN vs NH₃ | teks bantu di halaman pengaturan |
| `advicePhLow`, `advicePhHigh`, `adviceAmmoniaWarn`, `adviceAmmoniaDanger` | langkah di `DefaultConfig()` | isi `advice[].steps` |

`PUT` menolak ambang ≤ 0, bahaya < waspada, atau pH maks < min. Respons log, ringkasan, dan laporan menyertakan `advice` saat status bukan `NORMAL`. Satu konfigurasi untuk seluruh workspace.

### 5.10 Reports

| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/reports/purchases` | `from, to, businessUnitId?` | `{ items[], total }` |
| GET | `/reports/price-history` | `itemName` | `{ entries[], changes[] }` |
| GET | `/reports/rent` | `from?, to?` | `{ contracts[], totalPaid, totalRemaining }` |
| GET | `/reports/feed` | `from, to, status?` | `{ lots[], avgDurationDays }` |
| GET | `/reports/distribution` | `from, to, paymentStatus?` | `{ records[], totalPaid, totalUnpaid }` |
| GET | `/reports/summary` | `from, to` | `{ purchases, feed, rent, distribution }` |
| GET | `/reports/water-quality` | `from, to, businessUnitId?, days=7\|30` | `{ logs[], trends, notMeasuredToday[] }` |

### 5.11 Dashboard

| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/dashboard` | — | `{ waterQualitySummary[] }` (kartu keuangan §13 belum di endpoint ini) |

**`waterQualitySummary[]` item (T2):**
```json
{
  "businessUnitId": "uuid",
  "businessUnitName": "Kolam A",
  "lastMeasuredAt": "2026-09-21T07:30:00+07:00",
  "ammoniaPpm": 0.3,
  "ph": 7.2,
  "status": "NORMAL",
  "notMeasuredToday": false
}
```

Jika status bukan `NORMAL`, item yang sama menyertakan `advice[]` (`code`, `title`, `steps`) dari konfigurasi kolam itu.

### 5.12 Health

| Method | Endpoint | Response |
|---|---|---|
| GET | `/health` | `{ status: "ok", db: "ok", redis: "ok" }` |

---

## 6. Redis Cache Strategy

### Key Patterns

| Key Pattern | TTL | Isi | Invalidate On |
|---|---|---|---|
| `dashboard:{wsId}:{year}:{month}` | 60s | Dashboard response JSON | Any write in workspace |
| `report:{type}:{wsId}:{hash}` | 120s | Report response JSON | Write matching entity type |
| `ponds:{wsId}` | 300s | List kolam | CRUD pond |
| `water-quality:{wsId}:{hash}` | 120s | List/trends response | CRUD water quality log |
| `auth:blacklist:{jti}` | = token expiry | `"1"` | Logout |
| `auth:refresh:{userId}` | 7d | Refresh token (T3) | Logout all |

### Cache Helper (Go)

```go
// backend/internal/cache/redis.go
type Cache struct {
    rdb *redis.Client
}

func (c *Cache) GetJSON(ctx context.Context, key string, dest any) (bool, error) {
    val, err := c.rdb.Get(ctx, key).Result()
    if err == redis.Nil {
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return true, json.Unmarshal([]byte(val), dest)
}

func (c *Cache) SetJSON(ctx context.Context, key string, val any, ttl time.Duration) error {
    b, err := json.Marshal(val)
    if err != nil {
        return err
    }
    return c.rdb.Set(ctx, key, b, ttl).Err()
}

func (c *Cache) InvalidateWorkspace(ctx context.Context, workspaceID string) error {
    iter := c.rdb.Scan(ctx, 0, "*:"+workspaceID+":*", 100).Iterator()
    var keys []string
    for iter.Next(ctx) {
        keys = append(keys, iter.Val())
    }
    if len(keys) > 0 {
        return c.rdb.Del(ctx, keys...).Err()
    }
    return nil
}
```

### Cache Flow — Dashboard

```
GET /dashboard
  → Check Redis key dashboard:{wsId}:{year}:{month}
  → HIT  → return cached
  → MISS → query MariaDB → set Redis TTL 60s → return
```

### Invalidate On Write

Setiap POST/PUT/DELETE yang mengubah data workspace:
```go
cache.InvalidateWorkspace(ctx, workspaceID)
```

---

## 7. Auth (JWT)

### Login Flow

```
POST /auth/login { email, password }
  → bcrypt compare
  → generate JWT (HS256, 24h expiry, claims: userId, email, jti)
  → return { token, user }

Frontend:
  → store token in localStorage (or httpOnly cookie via proxy — MVP: localStorage)
  → axios interceptor attaches Authorization header
```

### JWT Claims

```go
type Claims struct {
    UserID string `json:"userId"`
    Email  string `json:"email"`
    JTI    string `json:"jti"`
    jwt.RegisteredClaims
}
```

### Middleware

```go
// backend/internal/middleware/auth.go
func AuthMiddleware(jwtSecret string, cache *cache.Cache) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenStr := extractBearer(c)
        claims, err := validateJWT(tokenStr, jwtSecret)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"success": false, "error": "UNAUTHORIZED"})
            return
        }
        // Check blacklist
        if blacklisted, _ := cache.IsBlacklisted(c, claims.JTI); blacklisted {
            c.AbortWithStatusJSON(401, gin.H{"success": false, "error": "TOKEN_REVOKED"})
            return
        }
        c.Set("userId", claims.UserID)
        c.Next()
    }
}

// backend/internal/middleware/workspace.go
func WorkspaceMiddleware(repo *repository.WorkspaceRepo) gin.HandlerFunc {
    return func(c *gin.Context) {
        wsID := c.GetHeader("X-Workspace-ID")
        userID := c.GetString("userId")
        ws, err := repo.FindByIDAndUser(c, wsID, userID)
        if err != nil || ws == nil {
            c.AbortWithStatusJSON(403, gin.H{"success": false, "error": "WORKSPACE_FORBIDDEN"})
            return
        }
        c.Set("workspaceId", ws.ID)
        c.Next()
    }
}
```

### Frontend Auth Client

```typescript
// frontend/src/api/client.ts
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace.store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const workspaceId = useWorkspaceStore.getState().activeId;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (workspaceId) config.headers['X-Workspace-ID'] = workspaceId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## 8. Key Service Implementations (Go)

### 8.1 Create Workspace

```go
func (s *WorkspaceService) Create(ctx context.Context, userID string, req dto.CreateWorkspaceRequest) (*model.Workspace, error) {
    ws := &model.Workspace{
        ID:         uuid.New().String(),
        UserID:     userID,
        Name:       req.Name,
        Type:       req.Type,
        TemplateID: templateForType(req.Type),
    }
    err := s.db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(ws).Error; err != nil {
            return err
        }
        return tx.Create(&model.CashAccount{
            ID:          uuid.New().String(),
            WorkspaceID: ws.ID,
            Name:        "Kas Utama",
            IsDefault:   true,
        }).Error
    })
    return ws, err
}
```

### 8.2 Generate Payment Schedules

```go
func GeneratePaymentSchedules(contract *model.PeriodicContract) []model.PaymentSchedule {
    if contract.PaymentScheme == model.LumpSum {
        return []model.PaymentSchedule{{
            ID:         uuid.New().String(),
            ContractID: contract.ID,
            DueDate:    contract.StartDate,
            Amount:     contract.TotalAmount,
        }}
    }
    monthly := contract.TotalAmount.Div(decimal.NewFromInt(int64(contract.DurationMonths)))
    schedules := make([]model.PaymentSchedule, contract.DurationMonths)
    for i := 0; i < contract.DurationMonths; i++ {
        schedules[i] = model.PaymentSchedule{
            ID:         uuid.New().String(),
            ContractID: contract.ID,
            DueDate:    contract.StartDate.AddDate(0, i, 0),
            Amount:     monthly,
        }
    }
    return schedules
}
```

### 8.3 Calculate Distribution

```go
func CalculateDistribution(scheme *model.DistributionScheme, gross, cost decimal.Decimal) (net decimal.Decimal, parties []dto.PartyAmount) {
    net = gross.Sub(cost)
    base := net
    if scheme.BaseType == model.BaseRevenue {
        base = gross
    }
    for _, p := range scheme.Parties {
        amount := p.Value
        if p.Type == "percent" {
            amount = base.Mul(p.Value).Div(decimal.NewFromInt(100))
        }
        parties = append(parties, dto.PartyAmount{Name: p.Name, Amount: amount})
    }
    return
}
```

### 8.4 Contract Status Resolver

```go
// Status waktu — derived on-read (BRD §9 BR-C4)
func ResolveTimeStatus(endDate time.Time) model.ContractTimeStatus {
    daysLeft := int(time.Until(endDate).Hours() / 24)
    if daysLeft <= 0 {
        return model.ContractEnded
    }
    if daysLeft <= 30 {
        return model.ContractExpiring
    }
    return model.ContractActive
}

// Status pembayaran — derived from schedules (BRD §9 BR-C5)
func ResolvePaymentStatus(schedules []model.PaymentSchedule) model.ContractPaymentStatus {
    paid := 0
    for _, s := range schedules {
        if s.IsPaid {
            paid++
        }
    }
    switch {
    case paid == 0:
        return model.PaymentUnpaid
    case paid == len(schedules):
        return model.PaymentPaid
    default:
        return model.PaymentPartial
    }
}

func NormalizeItemName(name string) string {
    return strings.ToLower(strings.TrimSpace(name))
}
```

---

## 9. Frontend Structure

### Routing

```typescript
// frontend/src/App.tsx
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'ponds', element: <PondListPage /> },
      { path: 'ponds/new', element: <PondFormPage /> },
      { path: 'ponds/:id/edit', element: <PondFormPage /> },
      { path: 'ponds/:id', element: <PondDetailPage /> },  // tabs: info | kualitas air (T2)
      { path: 'water-quality', element: <WaterQualityListPage /> },
      { path: 'water-quality/new', element: <WaterQualityFormPage /> },
      { path: 'water-quality/:id/edit', element: <WaterQualityFormPage /> },
      { path: 'water-quality/report', element: <WaterQualityReportPage /> },
      // admin: { path: 'settings/water-quality', element: <WaterQualityConfigPage /> },
      { path: 'purchases', element: <PurchaseListPage /> },
      { path: 'purchases/new', element: <PurchaseFormPage /> },
      { path: 'feed', element: <FeedListPage /> },
      { path: 'feed/:id', element: <FeedDetailPage /> },
      { path: 'rent', element: <RentListPage /> },
      { path: 'rent/new', element: <RentFormPage /> },
      { path: 'rent/:id', element: <RentDetailPage /> },
      { path: 'profit-share', element: <ProfitSharePage /> },
      { path: 'reports', element: <ReportIndexPage /> },
      { path: 'reports/:type', element: <ReportDetailPage /> },
      { path: 'personal', element: <PersonalExpensePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

Blok di atas adalah sketsa target. Route yang hidup ada di `frontend/src/App.tsx`: kualitas air di `/water-quality`, `/water-quality/report`, `/water-quality/new`, `/water-quality/:id/edit`; konfigurasi admin di `/settings/water-quality`; keuangan di `/finance`.

### TanStack Query Example

```typescript
// frontend/src/api/dashboard.api.ts
export function useDashboard(month?: number, year?: number) {
  return useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: () => api.get('/dashboard', { params: { month, year } }).then(r => r.data.data),
    staleTime: 30_000,
  });
}
```

### Template System (unchanged concept)

```typescript
// frontend/src/templates/lele/config.ts
export const leleTemplate = {
  id: 'lele',
  name: 'Usaha Lele',
  businessUnitLabel: 'Kolam',
  consumableLabel: 'Pakan',
  itemCategories: [
    { value: 'FEED', label: 'Pakan' },
    { value: 'TOOL', label: 'Alat' },
    // ...
  ],
  menu: [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/ponds', label: 'Kolam', icon: 'Fish' },
    { path: '/water-quality', label: 'Kualitas Air', icon: 'Droplets' }, // T2
    // ...
  ],
};
```

---

## 10. UI Components (Key)

| Component | Props | Dipakai di |
|---|---|---|
| `WorkspaceSwitcher` | workspaces, activeId, onSwitch | AppLayout header |
| `MoneyInput` | value, onChange | Semua form nominal |
| `DatePicker` | value, onChange | Semua form tanggal |
| `BusinessUnitSelect` | value, onChange | Form pembelian, pakan, sewa, kualitas air |
| `BatchSelect` | value, onChange | Form pembelian, pakan, kualitas air |
| `PurchaseForm` | onSubmit | P-06 |
| `ConsumablePromptDialog` | open, onConfirm, onCancel | P-07 |
| `PaymentScheduleTable` | schedules, onPay | P-12 |
| `DistributionCalculator` | scheme, grossResult, totalCost | P-15 |
| `SummaryCards` | data | P-03 |
| `FeedLotWidget` | activeLots | P-03 |
| `WaterQualityWidget` | waterQualitySummary | P-03 (T2) |
| `WaterQualityStatusBadge` | ammoniaPpm, ph | List, form, dashboard (T2) |
| `ReportTable` | columns, data, totals | P-17 |

---

## 11. Environment Variables

```bash
# .env.example

# ─── Backend ───
APP_PORT=8080
APP_ENV=development
JWT_SECRET=generate-with-openssl-rand-base64-32
JWT_EXPIRY=24h

DB_HOST=mariadb
DB_PORT=3306
DB_USER=pencatatan
DB_PASSWORD=pencatatan
DB_NAME=pencatatan_usaha

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

CORS_ORIGINS=http://localhost:5173

# ─── Frontend ───
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_NAME=Pencatatan Usaha
```

---

## 12. Docker Compose

```yaml
# docker-compose.yml
services:
  mariadb:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: root
      MARIADB_USER: pencatatan
      MARIADB_PASSWORD: pencatatan
      MARIADB_DATABASE: pencatatan_usaha
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      APP_PORT: 8080
      JWT_SECRET: ${JWT_SECRET}
      DB_HOST: mariadb
      DB_PORT: 3306
      DB_USER: pencatatan
      DB_PASSWORD: pencatatan
      DB_NAME: pencatatan_usaha
      REDIS_HOST: redis
      REDIS_PORT: 6379
      CORS_ORIGINS: http://localhost:5173
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - api

volumes:
  mariadb_data:
  redis_data:
```

---

## 13. Testing Strategy

### Backend (Go)

| Area | Tool | Test |
|---|---|---|
| Unit | testify | `GeneratePaymentSchedules`, `CalculateDistribution`, `ResolveContractStatus` |
| Integration | testify + testcontainers | MariaDB + Redis; CRUD workspace, purchase flow |
| Handler | httptest | Auth middleware, workspace forbidden, validation errors |

### Frontend (Vitest + Playwright)

| Area | Test |
|---|---|
| Unit | Zod schemas, template resolver, money formatter |
| E2E | Login → workspace → purchase → consumable → rent pay → distribution |

---

## 14. Security

| Concern | Mitigasi |
|---|---|
| Workspace isolation | Middleware validates `X-Workspace-ID` belongs to user |
| Auth | bcrypt (cost 12) + JWT HS256; logout blacklists jti in Redis |
| CORS | Whitelist frontend origin only |
| Input validation | go-playground/validator on all DTOs |
| SQL injection | GORM parameterized queries |
| XSS | React auto-escape |
| Rate limiting | Gin rate limiter on `/auth/login` (T2) |

---

## 15. Performance

| Concern | Approach |
|---|---|
| Dashboard | Redis cache 60s; invalidate on workspace write |
| Reports | Redis cache 120s; key = hash(query params) |
| List pages | Cursor pagination, limit 50 |
| DB indexes | `(workspace_id, transaction_date)`, `(workspace_id, status)` |
| Mobile | Vite code-splitting per route; responsive Tailwind |

---

## 16. Deployment Checklist

- [ ] MariaDB provisioned + migration run (`migrate -path migrations -database ... up`)
- [ ] Redis provisioned
- [ ] JWT_SECRET set (32+ bytes random)
- [ ] CORS_ORIGINS set to production domain
- [ ] Frontend built (`npm run build`) → nginx serve static
- [ ] API health check: `GET /api/v1/health`
- [ ] HTTPS via reverse proxy (nginx/caddy)
- [ ] MariaDB backup scheduled

---

## 17. Seed Script

```go
// backend/cmd/seed/main.go
func main() {
    hash, _ := bcrypt.GenerateFromPassword([]byte("changeme123"), 12)
    user := model.User{
        ID: uuid.New().String(), Email: "admin@example.com",
        PasswordHash: string(hash), Name: "Admin",
    }
    db.Create(&user)

    ws := model.Workspace{
        ID: uuid.New().String(), UserID: user.ID,
        Name: "Usaha Lele A", Type: model.WorkspaceBusiness, TemplateID: "lele",
    }
    db.Create(&ws)
    db.Create(&model.CashAccount{
        ID: uuid.New().String(), WorkspaceID: ws.ID, Name: "Kas Utama", IsDefault: true,
    })
    db.Create(&model.BusinessUnit{
        ID: uuid.New().String(), WorkspaceID: ws.ID, Name: "Kolam A", Location: "Desa X",
    })
}
```

---

## 18. Sprint → Technical Task Mapping

*Checkbox = status di repo saat ini (bukan rencana kosong).*

### Sprint 0 — Foundation

**Backend:**
- [x] Init Go module, **Fiber** router, config loader
- [x] Docker Compose: **MySQL** (Redis belum)
- [x] Migration `000001_init`, `000002_auth`
- [x] `database/sql` + health check `GET /health`
- [ ] Redis client + cache helper
- [x] Auth: login, JWT middleware
- [ ] Logout blacklist Redis
- [x] Seed admin (`EnsureAdmin`)

**Frontend:**
- [x] Vite + React + TypeScript
- [x] Tailwind + shadcn-style components
- [x] fetch client + JWT interceptor
- [x] React Router + ProtectedRoute + AdminRoute
- [x] LoginPage + AppLayout + User management pages
- [ ] WorkspaceSwitcher

**DoD:** Login → JWT → `/health` → dashboard shell. ⚠️ workspace switch belum.

### Sprint 1 — Master Data + Transaksi

**Backend:** [ ] Workspace CRUD · [x] Pond CRUD · [x] Batch list (`GET /batches`) · [x] Purchase create/list · [x] Other expense create · [ ] Personal expense · [ ] Workspace middleware penuh · [ ] Histori harga

**Frontend:** [ ] WorkspaceSwitcher · [x] Pond pages · [x] `/finance` + form pembelian & pengeluaran lain · [ ] Personal

### Sprint 2 — Pakan + Sewa + Laporan 1

**Backend / Frontend:** [ ] belum

### Sprint 3 — Bagi Hasil + Laporan 2 + Polish

**Backend / Frontend:** [ ] belum

### Sprint 4 — Kualitas Air (T2)

**Backend:**
- [x] `water_quality_logs` + CRUD + validation (BR-F1–F4, F6, F9–F11)
- [x] BR-F5 kolam INACTIVE ditolak saat create/update
- [x] Status NORMAL/WARNING/DANGER + `advice` dari konfigurasi kolam (BR-F7, BR-F12)
- [x] `GET/PUT /water-quality/config`, `POST /water-quality/evaluate`
- [x] `GET /water-quality-logs/trends`, `/dashboard`, `/reports/water-quality`
- [x] `GET /batches` (filter kolam)
- [ ] Redis cache invalidation

**Frontend:**
- [x] WaterQuality list + form (+ batch opsional, pratinjau saran)
- [x] Riwayat di PondDetailPage
- [x] Dashboard widget + badge + saran
- [x] `/water-quality/report` — grafik tren SVG 7/30 hari (RPT-07)
- [x] Admin `/settings/water-quality` — ambang dan teks saran

**DoD:** Epic E7 hampir lengkap; polish chart & batch CRUD UI opsional.

---

## 19. Referensi

- [BRD.md](./BRD.md) — business requirements (v1.5 + §23 status)
- [raw idea.md](./raw%20idea.md) — ide awal
- [jangka panjang.md](./jangka%20panjang.md) — visi jangka panjang

---

## 20. Status Implementasi (Codebase)

Ringkasan singkat — detail bisnis: [BRD §23](./BRD.md#23-status-implementasi-codebase).

| Area | Endpoint / halaman utama | Status |
|---|---|---|
| Health | `GET /health` | ✅ |
| Auth | `/api/v1/auth/*` | ✅ |
| Users | `/api/v1/users/*` (ADMIN) | ✅ |
| Kolam | `/ponds`, `/ponds/:id` | ✅ |
| Batch | `GET /batches` | ✅ list only |
| Kualitas air | `/water-quality-logs`, `/water-quality/config`, `/dashboard`, `/reports/water-quality` | ✅ |
| FE | `/login`, `/`, `/ponds`, `/water-quality`, `/water-quality/report`, `/settings/water-quality`, `/finance`, `/users` | ✅ |
| Workspace | `X-Workspace-ID` default UUID | ⚠️ satu workspace seed |
| Transaksi MVP | Pembelian + pengeluaran lain | ⚠️ sewa, pakan, bagi hasil, histori harga ❌ |
| Redis | cache + logout blacklist | ❌ |

**Backlog teknis berikutnya:** workspace CRUD + switcher → histori harga & sisa modul keuangan → Redis production hardening.
