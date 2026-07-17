import type { OrderStatus } from "@prisma/client";

/**
 * Canonical definition of "realized revenue" across the whole admin surface
 * (dashboard KPIs, revenue chart, top sellers): an order counts once money
 * has been collected or the order is on its way / delivered.
 * PENDING and AWAITING_PAYMENT (no money collected) and CANCELLED are
 * always excluded. Every revenue query must use this constant — never an
 * inline status list — so the numbers agree everywhere.
 */
export const REVENUE_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];
