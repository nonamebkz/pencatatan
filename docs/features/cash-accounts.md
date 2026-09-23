# Kelola akun kas

**Status:** `done`

## Business flow

- User login membuka **Keuangan → Akun kas** untuk melihat daftar sumber dana.
- Tambah/ubah nama dan tandai **default** (satu per workspace).
- Form pembelian & pengeluaran memuat daftar kas; default otomatis terpilih.
- **Hapus** hanya **ADMIN**, akun bukan default, belum punya transaksi; minimal satu akun tetap ada.

## API contract

| Method | Path | Auth | Body | Errors |
|--------|------|------|------|--------|
| GET | `/cash-accounts` | JWT | — | — |
| GET | `/cash-accounts/:id` | JWT | — | `NOT_FOUND` |
| POST | `/cash-accounts` | JWT | `{ name, isDefault? }` | `VALIDATION_ERROR` |
| PUT | `/cash-accounts/:id` | JWT | `{ name, isDefault? }` | `NOT_FOUND`, `VALIDATION_ERROR` |
| DELETE | `/cash-accounts/:id` | JWT + ADMIN | — | `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND` |

## Frontend contract

| Route | Halaman |
|-------|---------|
| `/finance/cash-accounts` | `CashAccountListPage` |
| `/finance/cash-accounts/new` | `CashAccountFormPage` |
| `/finance/cash-accounts/:id/edit` | `CashAccountFormPage` |

API: `frontend/src/api/finance.ts` — `listCashAccounts`, `getCashAccount`, `createCashAccount`, `updateCashAccount`, `deleteCashAccount`.
