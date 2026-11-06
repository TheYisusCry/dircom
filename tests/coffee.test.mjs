import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCoffeeLeaderboard,
  calculateAllEmployeeCoffeeStatuses,
  calculateCoffeeOfficeSummary,
  calculateEmployeeCoffeeStatus,
  getRequiredMonths,
  indexCoffeeDeliveries,
} from "../src/lib/coffee.ts";

test("getRequiredMonths calcula correctamente los meses exigidos", () => {
  // Empleados creados antes o en el mes de inicio del sistema (Nov 2026)
  assert.equal(getRequiredMonths("2026-10-15T00:00:00Z", 2026, 11), 1);
  assert.equal(getRequiredMonths("2026-11-01T00:00:00Z", 2026, 11), 1);
  assert.equal(getRequiredMonths("2026-11-20T00:00:00Z", 2026, 12), 2);
  assert.equal(getRequiredMonths("2026-10-01T00:00:00Z", 2027, 1), 3);

  // Empleado que ingresa después del inicio del sistema (ej. Enero 2027)
  assert.equal(getRequiredMonths("2027-01-10T00:00:00Z", 2027, 1), 1);
  assert.equal(getRequiredMonths("2027-01-10T00:00:00Z", 2027, 3), 3);

  // Fecha inválida o vacía recurre al inicio del sistema
  assert.equal(getRequiredMonths("", 2026, 11), 1);
});

test("calculateEmployeeCoffeeStatus maneja deudas, cumplimiento y adelantos", () => {
  const emp = {
    id: "emp-1",
    first_name: "Carlos",
    last_name: "Pérez",
    job_title: "Diseñador",
    avatar_path: null,
    created_at: "2026-10-01T00:00:00Z",
  };

  // 1. Sin entregas en Noviembre 2026 -> Debe café
  const statusNoDeliveries = calculateEmployeeCoffeeStatus(emp, [], 2026, 11);
  assert.equal(statusNoDeliveries.requiredMonths, 1);
  assert.equal(statusNoDeliveries.totalDelivered, 0);
  assert.equal(statusNoDeliveries.balance, -1);
  assert.equal(statusNoDeliveries.status, "pending");
  assert.equal(statusNoDeliveries.deliveredThisMonth, 0);

  // 2. Trae 1 paquete en Noviembre -> Al día
  const deliveriesNov = [
    {
      id: "d1",
      employee_id: "emp-1",
      quantity: 1,
      delivery_date: "2026-11-05",
      note: "Café tostado",
      registered_by: "admin-1",
      created_at: "2026-11-05T10:00:00Z",
    },
  ];
  const statusOneDelivery = calculateEmployeeCoffeeStatus(emp, deliveriesNov, 2026, 11);
  assert.equal(statusOneDelivery.totalDelivered, 1);
  assert.equal(statusOneDelivery.balance, 0);
  assert.equal(statusOneDelivery.status, "up_to_date");
  assert.equal(statusOneDelivery.deliveredThisMonth, 1);
  assert.equal(statusOneDelivery.lastDeliveryDate, "2026-11-05");

  // 3. Trae 2 paquetes en Noviembre -> Adelantado (+1 crédito para Diciembre)
  const deliveriesTwo = [
    ...deliveriesNov,
    {
      id: "d2",
      employee_id: "emp-1",
      quantity: 1,
      delivery_date: "2026-11-20",
      note: "Segundo paquete",
      registered_by: "admin-1",
      created_at: "2026-11-20T10:00:00Z",
    },
  ];
  const statusInAdvance = calculateEmployeeCoffeeStatus(emp, deliveriesTwo, 2026, 11);
  assert.equal(statusInAdvance.totalDelivered, 2);
  assert.equal(statusInAdvance.balance, 1);
  assert.equal(statusInAdvance.status, "in_advance");
  assert.equal(statusInAdvance.deliveredThisMonth, 2);

  // 4. En Diciembre 2026, con esos mismos 2 paquetes entregados -> Sigue Al día (cubierto por el adelanto)
  const statusDec = calculateEmployeeCoffeeStatus(emp, deliveriesTwo, 2026, 12);
  assert.equal(statusDec.requiredMonths, 2);
  assert.equal(statusDec.totalDelivered, 2);
  assert.equal(statusDec.balance, 0);
  assert.equal(statusDec.status, "up_to_date");
  assert.equal(statusDec.deliveredThisMonth, 0); // Este mes no trajo nada, pero está cubierto

  // 5. En Enero 2027 sin nuevas entregas -> Vuelve a deber (-1)
  const statusJan = calculateEmployeeCoffeeStatus(emp, deliveriesTwo, 2027, 1);
  assert.equal(statusJan.requiredMonths, 3);
  assert.equal(statusJan.totalDelivered, 2);
  assert.equal(statusJan.balance, -1);
  assert.equal(statusJan.status, "pending");
});

test("buildCoffeeLeaderboard ordena por total y asigna insignias", () => {
  const statuses = [
    {
      employeeId: "emp-1",
      employeeName: "Ana Silva",
      jobTitle: "Dev",
      avatarPath: null,
      requiredMonths: 1,
      totalDelivered: 5,
      balance: 4,
      status: "in_advance",
      deliveredThisMonth: 1,
      lastDeliveryDate: "2026-11-01",
    },
    {
      employeeId: "emp-2",
      employeeName: "Beto Ruiz",
      jobTitle: "Diseño",
      avatarPath: null,
      requiredMonths: 1,
      totalDelivered: 3,
      balance: 2,
      status: "in_advance",
      deliveredThisMonth: 1,
      lastDeliveryDate: "2026-11-02",
    },
    {
      employeeId: "emp-3",
      employeeName: "Carlos Vega",
      jobTitle: "Admin",
      avatarPath: null,
      requiredMonths: 1,
      totalDelivered: 1,
      balance: 0,
      status: "up_to_date",
      deliveredThisMonth: 1,
      lastDeliveryDate: "2026-11-03",
    },
    {
      employeeId: "emp-4",
      employeeName: "Daniela Ramos",
      jobTitle: "Marketing",
      avatarPath: null,
      requiredMonths: 1,
      totalDelivered: 0,
      balance: -1,
      status: "pending",
      deliveredThisMonth: 0,
      lastDeliveryDate: null,
    },
  ];

  const deliveries = [
    { employee_id: "emp-1" },
    { employee_id: "emp-1" },
    { employee_id: "emp-2" },
    { employee_id: "emp-3" },
  ];

  const leaderboard = buildCoffeeLeaderboard(statuses, deliveries);

  assert.equal(leaderboard[0].employeeName, "Ana Silva");
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[0].badge, "☕ Gran Cafetero");
  assert.equal(leaderboard[0].deliveriesCount, 2);

  assert.equal(leaderboard[1].employeeName, "Beto Ruiz");
  assert.equal(leaderboard[1].rank, 2);
  assert.equal(leaderboard[1].badge, "⭐ Patrocinador Estrella");

  assert.equal(leaderboard[2].employeeName, "Carlos Vega");
  assert.equal(leaderboard[2].rank, 3);
  assert.equal(leaderboard[2].badge, "🌱 Aliado del Grano");

  assert.equal(leaderboard[3].employeeName, "Daniela Ramos");
  assert.equal(leaderboard[3].rank, 4);
  assert.equal(leaderboard[3].badge, undefined); // 0 entregas no tiene insignia
});

test("calculateCoffeeOfficeSummary resume métricas de la oficina", () => {
  const statuses = [
    { status: "up_to_date", totalDelivered: 2 },
    { status: "in_advance", totalDelivered: 4 },
    { status: "pending", totalDelivered: 0 },
    { status: "pending", totalDelivered: 1 },
  ];

  const summary = calculateCoffeeOfficeSummary(statuses, 2026, 11);
  assert.equal(summary.totalEmployees, 4);
  assert.equal(summary.upToDateCount, 2);
  assert.equal(summary.pendingCount, 2);
  assert.equal(summary.officeTotalPackages, 7);
  assert.equal(summary.progressPercentage, 50);
  assert.equal(summary.currentMonthLabel, "Noviembre 2026");
});

test("calculateAllEmployeeCoffeeStatuses procesa en lote O(E + D) con resultados identicos", () => {
  const employees = [
    {
      id: "emp-1",
      first_name: "Ana",
      last_name: "Silva",
      created_at: "2026-10-01T00:00:00Z",
    },
    {
      id: "emp-2",
      first_name: "Beto",
      last_name: "Ruiz",
      created_at: "2026-11-01T00:00:00Z",
    },
  ];

  const deliveries = [
    {
      id: "d1",
      employee_id: "emp-1",
      quantity: 1,
      delivery_date: "2026-11-02",
      note: null,
      registered_by: "admin",
      created_at: "2026-11-02T10:00:00Z",
    },
    {
      id: "d2",
      employee_id: "emp-1",
      quantity: 2,
      delivery_date: "2026-11-15",
      note: null,
      registered_by: "admin",
      created_at: "2026-11-15T10:00:00Z",
    },
    {
      id: "d3",
      employee_id: "emp-2",
      quantity: 1,
      delivery_date: "2026-11-10",
      note: null,
      registered_by: "admin",
      created_at: "2026-11-10T10:00:00Z",
    },
  ];

  const summaryMap = indexCoffeeDeliveries(deliveries, 2026, 11);
  assert.equal(summaryMap.size, 2);
  assert.equal(summaryMap.get("emp-1")?.totalDelivered, 3);
  assert.equal(summaryMap.get("emp-2")?.totalDelivered, 1);

  const batchResults = calculateAllEmployeeCoffeeStatuses(employees, deliveries, 2026, 11);
  const individual1 = calculateEmployeeCoffeeStatus(employees[0], deliveries, 2026, 11);
  const individual2 = calculateEmployeeCoffeeStatus(employees[1], deliveries, 2026, 11);

  assert.deepEqual(batchResults[0], individual1);
  assert.deepEqual(batchResults[1], individual2);
  assert.equal(batchResults[0].lastDeliveryDate, "2026-11-15");
  assert.equal(batchResults[0].totalDelivered, 3);
  assert.equal(batchResults[1].lastDeliveryDate, "2026-11-10");
  assert.equal(batchResults[1].totalDelivered, 1);
});
