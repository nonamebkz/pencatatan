# Kelola akun kas

**Status:** `done`

**Katalog akses:** entri halaman `page.finance.cash_accounts` di [`shared/access-catalog.json`](../../shared/access-catalog.json) — selaras checkbox form Peran, seed DB, dan visibilitas menu Keuangan / link Akun kas (`canSeeCatalogMenu`, `canPageAction`).

## Business flow

- User dengan permission kas (mis. `cash_account.read` atau sibling di subtree menu Keuangan) melihat **Keuangan** di nav dan membuka **Akun kas**.
- Tambah/ubah nama dan tandai **default** (satu per workspace).
- Form pembelian & pengeluaran memuat daftar kas; default otomatis terpilih.
- **Hapus** membutuhkan permission `cash_account.delete` (biasanya admin); akun bukan default, belum punya transaksi; minimal satu akun tetap ada.
- Migrasi `000003_finance` menyisipkan **Kas Utama** default jika belum ada.

## API contract

| Method | Path | Permission | Body | Errors |
|--------|------|------------|------|--------|
| GET | `/cash-accounts` | `cash_account.read` | — | `FORBIDDEN` |
| GET | `/cash-accounts/:id` | `cash_account.read` | — | `FORBIDDEN`, `NOT_FOUND` |
| POST | `/cash-accounts` | `cash_account.create` | `{ name, isDefault? }` | `FORBIDDEN`, `VALIDATION_ERROR` |
| PUT | `/cash-accounts/:id` | `cash_account.update` | `{ name, isDefault? }` | `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR` |
| DELETE | `/cash-accounts/:id` | `cash_account.delete` | — | `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND` |

## Frontend contract

| Route | Halaman | Permission route |
|-------|---------|------------------|
| `/finance/cash-accounts` | `CashAccountListPage` | `cash_account.read` |
| `/finance/cash-accounts/new` | `CashAccountFormPage` | `cash_account.create` |
| `/finance/cash-accounts/:id/edit` | `CashAccountFormPage` | `cash_account.update` |

API: `frontend/src/api/finance.ts` — `listCashAccounts`, `getCashAccount`, `createCashAccount`, `updateCashAccount`, `deleteCashAccount`.
