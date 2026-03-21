# AQN Praxis

**Plataforma de Evaluación e Intervención Psicológica**  
Psiquis AQN · Santiago, Chile

AQN Praxis es un sistema clínico integral para psicólogos escolares y clínicos que integra evaluación psicológica estandarizada, scoring automático, generación de informes, programas de intervención y seguimiento de logros — todo en una sola plataforma.

---

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: Supabase (PostgreSQL + Realtime + Auth)
- **Pagos**: Transbank WebPay Plus
- **Deploy**: Vercel

## Tests integrados

| Test | Motor | Normas |
|------|-------|--------|
| WISC-V Chile | ✅ Completo | CEDETi UC / PUC Chile |
| PECA | ✅ Completo | Ps. Antonio Baeza H. (prototipo AQN) |
| BDI-II | ✅ Completo | Beck, Steer & Brown (1996) |
| Coopersmith SEI | ✅ Completo | Brinkmann et al. (1989) Chile |
| STAI | ⏸ Excluido | Requiere licencia TEA Ediciones |

## Programas de intervención

| Programa | Sesiones | Autor |
|----------|----------|-------|
| PDPI | 59 (0–58) | Ps. Juan Francisco Sotomayor J. |
| TP-CREM | 12 ejercicios | Ps. Juan Francisco Sotomayor J. |
| POSMAN | 11 ejercicios | Ps. Juan Francisco Sotomayor J. |

## Migraciones Supabase

```bash
# Aplicar en orden
supabase db push supabase/migrations/001_initial_schema.sql
supabase db push supabase/migrations/002_wisc5_norms_seed.sql
supabase db push supabase/migrations/003_wisc5_norms_complete.sql
supabase db push supabase/migrations/004_peca_table.sql
supabase db push supabase/migrations/004_payments.sql
supabase db push supabase/migrations/005_wisc5_a1_complete.sql
supabase db push supabase/migrations/006_activities.sql
```

## Variables de entorno

Ver `.env.local.example`

---

Desarrollado con Psiquis AQN · 2025–2026
