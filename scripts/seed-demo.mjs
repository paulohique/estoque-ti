import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

function parseEnv(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

async function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = await fs.readFile(envPath, "utf8");
    const parsed = parseEnv(content);

    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env.
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(date) {
  return formatDateTime(date).slice(0, 10);
}

function shiftDate({ months = 0, days = 0, hours = 0 } = {}) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date;
}

async function insertRows(connection, table, columns, rows) {
  if (!rows.length) {
    return;
  }

  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns
    .map(() => "?")
    .join(", ")})`;

  for (const row of rows) {
    await connection.query(sql, row);
  }
}

async function clearDemoTables(connection) {
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of [
    "stock_movements",
    "item_images",
    "audit_logs",
    "items",
    "categories",
    "sectors",
    "user_permissions",
    "role_permissions",
    "users",
    "permissions",
    "roles",
  ]) {
    await connection.query(`DELETE FROM ${table}`);
  }
}

async function seedDemoData(connection) {
  const roles = [
    [1, "admin", "Administrador total"],
    [2, "tecnico", "Tecnico de TI"],
    [3, "auditor", "Auditoria e conformidade"],
    [4, "estoque", "Operador de estoque"],
  ];

  const permissions = [
    [1, "view_dashboard", "Ver dashboard"],
    [2, "view_items", "Ver itens"],
    [3, "create_item", "Cadastrar item"],
    [4, "update_item", "Editar item"],
    [5, "withdraw_item", "Retirar item"],
    [6, "audit_log", "Ver auditoria"],
    [7, "manage_users", "Gerenciar usuarios"],
    [8, "delete_item", "Inativar item"],
    [9, "manage_categories", "Gerenciar categorias"],
    [10, "manage_sectors", "Gerenciar setores"],
  ];

  const rolePermissions = [
    ...permissions.map((permission) => [1, permission[0]]),
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [2, 8],
    [3, 1],
    [3, 2],
    [3, 6],
    [4, 1],
    [4, 2],
    [4, 3],
    [4, 4],
    [4, 5],
    [4, 8],
    [4, 9],
    [4, 10],
  ];

  const users = [
    [
      1,
      "admin",
      "Admin",
      "admin@local",
      "admin",
      1,
      1,
      0,
      formatDateTime(shiftDate({ days: 1 })),
      null,
      formatDateTime(shiftDate({ months: 5, days: 20 })),
      formatDateTime(shiftDate({ days: 1 })),
    ],
    [
      2,
      "ana.mendes",
      "Ana Mendes",
      "ana.mendes@empresa.local",
      "demo123",
      2,
      1,
      0,
      formatDateTime(shiftDate({ days: 2 })),
      null,
      formatDateTime(shiftDate({ months: 5, days: 18 })),
      formatDateTime(shiftDate({ days: 2 })),
    ],
    [
      3,
      "carlos.souza",
      "Carlos Souza",
      "carlos.souza@empresa.local",
      "demo123",
      4,
      1,
      0,
      formatDateTime(shiftDate({ days: 3 })),
      null,
      formatDateTime(shiftDate({ months: 5, days: 17 })),
      formatDateTime(shiftDate({ days: 3 })),
    ],
    [
      4,
      "julia.lima",
      "Julia Lima",
      "julia.lima@empresa.local",
      "demo123",
      3,
      1,
      0,
      formatDateTime(shiftDate({ days: 4 })),
      null,
      formatDateTime(shiftDate({ months: 5, days: 16 })),
      formatDateTime(shiftDate({ days: 4 })),
    ],
    [
      5,
      "bruno.farias",
      "Bruno Farias",
      "bruno.farias@empresa.local",
      "demo123",
      2,
      1,
      1,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 15 })),
      formatDateTime(shiftDate({ months: 1, days: 2 })),
    ],
    [
      6,
      "paula.rocha",
      "Paula Rocha",
      "paula.rocha@empresa.local",
      "demo123",
      4,
      1,
      0,
      formatDateTime(shiftDate({ days: 6 })),
      null,
      formatDateTime(shiftDate({ months: 5, days: 14 })),
      formatDateTime(shiftDate({ days: 6 })),
    ],
    [
      7,
      "fernanda.alves",
      "Fernanda Alves",
      "fernanda.alves@empresa.local",
      "demo123",
      1,
      1,
      0,
      formatDateTime(shiftDate({ days: 7 })),
      null,
      formatDateTime(shiftDate({ months: 5, days: 13 })),
      formatDateTime(shiftDate({ days: 7 })),
    ],
  ];

  const userPermissions = [
    [2, 9, 1],
    [4, 3, 1],
    [6, 10, 0],
  ];

  const sectors = [
    [1, "Suporte N1", "Central de atendimento e triagem"],
    [2, "Suporte N2", "Atendimento especializado"],
    [3, "Redes", "Infraestrutura de rede"],
    [4, "Financeiro", "Area financeira e fiscal"],
    [5, "Diretoria", "Sala da diretoria"],
    [6, "Almoxarifado", "Estoque central"],
    [7, "Comercial", "Equipe comercial"],
  ];

  const categories = [
    [1, "Notebooks", "Computadores portateis"],
    [2, "Desktops", "Computadores de mesa"],
    [3, "Monitores", "Monitores e telas"],
    [4, "Perifericos", "Mouse, teclado e acessorios"],
    [5, "Rede", "Equipamentos de rede"],
    [6, "Telefonia", "Celulares e telefonia corporativa"],
    [7, "Impressoras", "Equipamentos de impressao"],
  ];

  const items = [
    [
      1,
      1,
      "Notebook Lenovo ThinkPad E14",
      "Notebook",
      "AT-0001",
      "NB-THINKPAD-E14",
      "LNV-7842",
      "Notebook corporativo para o financeiro",
      "Maria Santos",
      "em_uso",
      "Financeiro",
      "Lenovo",
      "NF-20481",
      "2025-10-14",
      6899.9,
      "/demo-assets/item-placeholder.svg",
      8,
      2,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 12 })),
      formatDateTime(shiftDate({ days: 8 })),
    ],
    [
      2,
      1,
      "Notebook Dell Latitude 5440",
      "Notebook",
      "AT-0002",
      "NB-LAT-5440",
      "DLL-9420",
      "Notebook para diretoria e reunioes",
      "Diretoria Executiva",
      "em_uso",
      "Diretoria",
      "Dell",
      "NF-20482",
      "2025-11-02",
      8390,
      "/demo-assets/item-placeholder.svg",
      6,
      2,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 11 })),
      formatDateTime(shiftDate({ days: 8 })),
    ],
    [
      3,
      1,
      "Notebook Acer Aspire 5",
      "Notebook",
      "AT-0003",
      "NB-ASP-5",
      "ACR-7710",
      "Reserva para testes e contingencia",
      "Bruno Farias",
      "manutencao",
      "Sala de Suporte",
      "Acer",
      "NF-20483",
      "2025-12-05",
      4390,
      "/demo-assets/item-placeholder.svg",
      2,
      1,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 10 })),
      formatDateTime(shiftDate({ days: 9 })),
    ],
    [
      4,
      2,
      "Desktop Dell OptiPlex 7010",
      "Desktop",
      "AT-0101",
      "DT-OPTI-7010",
      "OPT-1102",
      "Estacao fixa da equipe administrativa",
      "Equipe Administrativa",
      "em_estoque",
      "Almoxarifado",
      "Dell",
      "NF-20484",
      "2025-09-18",
      5120,
      "/demo-assets/item-placeholder.svg",
      4,
      2,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 9 })),
      formatDateTime(shiftDate({ days: 7 })),
    ],
    [
      5,
      3,
      "Monitor LG 24MK600",
      "Monitores",
      "AT-0201",
      "MON-LG-24",
      "LG-2408",
      "Monitores para postos de atendimento",
      "Suporte N1",
      "em_uso",
      "Suporte N1",
      "LG",
      "NF-20485",
      "2025-08-12",
      1090,
      "/demo-assets/item-placeholder.svg",
      12,
      4,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 8 })),
      formatDateTime(shiftDate({ days: 7 })),
    ],
    [
      6,
      3,
      "Monitor Samsung 27 F27T",
      "Monitores",
      "AT-0202",
      "MON-SAM-27",
      "SNG-2701",
      "Monitor extra para sala de reuniao",
      "Paula Rocha",
      "em_uso",
      "Comercial",
      "Samsung",
      "NF-20486",
      "2025-07-20",
      1450,
      "/demo-assets/item-placeholder.svg",
      9,
      4,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 7 })),
      formatDateTime(shiftDate({ days: 7 })),
    ],
    [
      7,
      4,
      "Mouse Logitech M170",
      "Perifericos",
      "AT-0301",
      "MS-LOG-M170",
      "LOG-1701",
      "Mouse sem fio para escritorio compartilhado",
      "Almoxarifado",
      "em_estoque",
      "Almoxarifado",
      "Logitech",
      "NF-20487",
      "2026-01-15",
      79.9,
      "/demo-assets/item-placeholder.svg",
      3,
      10,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 6 })),
      formatDateTime(shiftDate({ days: 6 })),
    ],
    [
      8,
      4,
      "Headset Jabra Evolve2 40",
      "Perifericos",
      "AT-0302",
      "HD-JABRA-40",
      "JBR-4022",
      "Headsets para atendimento e salas de reuniao",
      "Suporte N2",
      "em_uso",
      "Suporte N2",
      "Jabra",
      "NF-20488",
      "2025-06-11",
      689.9,
      "/demo-assets/item-placeholder.svg",
      5,
      4,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 5 })),
      formatDateTime(shiftDate({ days: 6 })),
    ],
    [
      9,
      5,
      "Switch TP-Link 24 portas",
      "Rede",
      "AT-0401",
      "SW-TP-24P",
      "TPL-2401",
      "Switch de acesso para rede corporativa",
      "Redes",
      "em_estoque",
      "Almoxarifado",
      "TP-Link",
      "NF-20489",
      "2025-05-03",
      1299.9,
      "/demo-assets/item-placeholder.svg",
      2,
      1,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 4 })),
      formatDateTime(shiftDate({ days: 5 })),
    ],
    [
      10,
      5,
      "Access Point Ubiquiti U6-LR",
      "Rede",
      "AT-0402",
      "AP-U6-LR",
      "UBQ-6601",
      "Access point Wi-Fi de alta densidade",
      "Redes",
      "em_uso",
      "Corredor Principal",
      "Ubiquiti",
      "NF-20490",
      "2025-04-25",
      1690,
      "/demo-assets/item-placeholder.svg",
      3,
      1,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 3 })),
      formatDateTime(shiftDate({ days: 5 })),
    ],
    [
      11,
      6,
      "Smartphone Samsung A54",
      "Telefonia",
      "AT-0501",
      "TEL-A54",
      "SMA-5401",
      "Celular corporativo para supervisao",
      "Equipe Comercial",
      "em_uso",
      "Comercial",
      "Samsung",
      "NF-20491",
      "2025-03-30",
      2199.9,
      "/demo-assets/item-placeholder.svg",
      7,
      2,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 2 })),
      formatDateTime(shiftDate({ days: 4 })),
    ],
    [
      12,
      7,
      "Impressora Brother DCP-L2540DW",
      "Impressoras",
      "AT-0601",
      "IMP-BRO-L2540",
      "BR-2540",
      "Impressora de apoio para documentos internos",
      "Almoxarifado",
      "manutencao",
      "TI",
      "Brother",
      "NF-20492",
      "2025-02-11",
      1490,
      "/demo-assets/item-placeholder.svg",
      1,
      1,
      null,
      null,
      formatDateTime(shiftDate({ months: 5, days: 1 })),
      formatDateTime(shiftDate({ days: 4 })),
    ],
    [
      13,
      4,
      "Docking Station Dell WD19",
      "Perifericos",
      "AT-0303",
      "DK-DELL-WD19",
      "DL-1909",
      "Docking station para notebooks executivos",
      "Diretoria Executiva",
      "em_estoque",
      "Almoxarifado",
      "Dell",
      "NF-20493",
      "2025-01-28",
      1399.9,
      "/demo-assets/item-placeholder.svg",
      4,
      2,
      null,
      null,
      formatDateTime(shiftDate({ months: 4, days: 10 })),
      formatDateTime(shiftDate({ days: 3 })),
    ],
    [
      14,
      4,
      "Webcam Logitech C920",
      "Perifericos",
      "AT-0304",
      "WC-LOG-C920",
      "LOG-9201",
      "Webcam para salas de reuniao",
      "Comercial",
      "em_estoque",
      "Almoxarifado",
      "Logitech",
      "NF-20494",
      "2025-01-17",
      399.9,
      "/demo-assets/item-placeholder.svg",
      5,
      3,
      null,
      null,
      formatDateTime(shiftDate({ months: 4, days: 9 })),
      formatDateTime(shiftDate({ days: 3 })),
    ],
  ];

  const itemImages = [
    [1, 1, "thinkpad-e14-front.svg", "/demo-assets/item-placeholder.svg", formatDateTime(shiftDate({ days: 8 }))],
    [2, 2, "latitude-5440-front.svg", "/demo-assets/item-placeholder.svg", formatDateTime(shiftDate({ days: 8 }))],
    [3, 5, "monitor-lg-front.svg", "/demo-assets/item-placeholder.svg", formatDateTime(shiftDate({ days: 7 }))],
    [4, 10, "ubiquiti-ap-front.svg", "/demo-assets/item-placeholder.svg", formatDateTime(shiftDate({ days: 6 }))],
  ];

  const movements = [
    [1, 1, "out", 1, 3, 4, "GLPI-260501", "resolvido", "Notebook retirado para fechamento contabil", formatDateTime(shiftDate({ days: 1 }))],
    [2, 5, "out", 2, 2, 5, "GLPI-260502", "em_andamento", "Monitores enviados para a diretoria", formatDateTime(shiftDate({ days: 2 }))],
    [3, 2, "transfer", 1, 6, 6, "GLPI-260503", "registrado", "Transferencia entre salas executivas", formatDateTime(shiftDate({ days: 3 }))],
    [4, 7, "in", 8, 1, null, null, "concluido", "Lote de mouses recebido do fornecedor", formatDateTime(shiftDate({ days: 4 }))],
    [5, 7, "out", 4, 3, 6, "GLPI-260411", "resolvido", "Mouses destinados ao novo posto de atendimento", formatDateTime(shiftDate({ months: 1, days: 5 }))],
    [6, 11, "out", 1, 2, 2, "GLPI-260412", "resolvido", "Celular corporativo entregue ao comercial", formatDateTime(shiftDate({ months: 1, days: 8 }))],
    [7, 4, "out", 1, 6, 4, "GLPI-260413", "em_andamento", "Desktop provisionado para escritorio local", formatDateTime(shiftDate({ months: 1, days: 12 }))],
    [8, 10, "transfer", 1, 1, 3, "GLPI-260414", "aberto", "Access point movido para o corredor central", formatDateTime(shiftDate({ months: 1, days: 15 }))],
    [9, 2, "out", 1, 4, 5, "GLPI-260315", "resolvido", "Notebook usado na reuniao da diretoria", formatDateTime(shiftDate({ months: 2, days: 4 }))],
    [10, 8, "out", 1, 2, 1, "GLPI-260316", "resolvido", "Headset encaminhado para suporte n1", formatDateTime(shiftDate({ months: 2, days: 6 }))],
    [11, 12, "in", 1, 1, null, null, "aguardando_peca", "Impressora recebida para manutencao", formatDateTime(shiftDate({ months: 2, days: 10 }))],
    [12, 9, "out", 1, 3, 6, "GLPI-260217", "resolvido", "Switch instalado no almoxarifado", formatDateTime(shiftDate({ months: 3, days: 3 }))],
    [13, 1, "out", 1, 2, 4, "GLPI-260218", "resolvido", "Notebook deslocado para o financeiro", formatDateTime(shiftDate({ months: 3, days: 9 }))],
    [14, 14, "out", 2, 6, 7, "GLPI-260119", "em_andamento", "Webcams entregues para a area comercial", formatDateTime(shiftDate({ months: 4, days: 5 }))],
    [15, 6, "transfer", 1, 4, 3, "GLPI-260120", "registrado", "Monitor transferido para a sala de suporte", formatDateTime(shiftDate({ months: 4, days: 13 }))],
    [16, 3, "out", 1, 3, 5, "GLPI-251221", "resolvido", "Notebook reserva usado em homologacao", formatDateTime(shiftDate({ months: 5, days: 2 }))],
    [17, 5, "out", 3, 2, 2, "GLPI-251222", "resolvido", "Monitores enviados para montagem de postos", formatDateTime(shiftDate({ months: 5, days: 7 }))],
    [18, 7, "in", 5, 1, null, null, "concluido", "Novo lote de mouses recebido", formatDateTime(shiftDate({ months: 5, days: 15 }))],
  ];

  const auditLogs = [
    [1, "item", 1, "create", 1, "admin", "10.10.1.10", "/api/items", null, JSON.stringify({ name: "Notebook Lenovo ThinkPad E14" }), JSON.stringify({ source: "seed-demo" }), formatDateTime(shiftDate({ days: 15 }))],
    [2, "item", 5, "create", 1, "admin", "10.10.1.10", "/api/items", null, JSON.stringify({ name: "Monitor LG 24MK600" }), JSON.stringify({ source: "seed-demo" }), formatDateTime(shiftDate({ days: 14 }))],
    [3, "movement", 1, "create", 3, "carlos.souza", "10.10.2.21", "/api/withdraw", null, JSON.stringify({ itemId: 1, quantity: 1 }), JSON.stringify({ status: "resolvido" }), formatDateTime(shiftDate({ days: 1 }))],
    [4, "movement", 5, "create", 2, "ana.mendes", "10.10.2.22", "/api/withdraw", null, JSON.stringify({ itemId: 5, quantity: 2 }), JSON.stringify({ status: "em_andamento" }), formatDateTime(shiftDate({ days: 2 }))],
    [5, "access", 2, "update", 1, "admin", "10.10.1.10", "/api/access/users/2", null, JSON.stringify({ roleId: 2 }), JSON.stringify({ roleId: 2, overrides: ["manage_categories"] }), formatDateTime(shiftDate({ days: 3 }))],
    [6, "access", 4, "update", 1, "admin", "10.10.1.10", "/api/access/users/4", null, JSON.stringify({ roleId: 3 }), JSON.stringify({ roleId: 3, overrides: ["create_item"] }), formatDateTime(shiftDate({ days: 4 }))],
    [7, "item", 9, "update", 2, "ana.mendes", "10.10.2.22", "/api/items/9", JSON.stringify({ qty_total: 1 }), JSON.stringify({ qty_total: 2 }), JSON.stringify({ source: "seed-demo" }), formatDateTime(shiftDate({ months: 1, days: 5 }))],
    [8, "movement", 8, "create", 6, "paula.rocha", "10.10.2.33", "/api/withdraw", null, JSON.stringify({ itemId: 10, quantity: 1 }), null, formatDateTime(shiftDate({ months: 1, days: 15 }))],
    [9, "item", 12, "update", 1, "admin", "10.10.1.10", "/api/items/12", JSON.stringify({ itemStatus: "em_uso" }), JSON.stringify({ itemStatus: "manutencao" }), null, formatDateTime(shiftDate({ months: 2, days: 10 }))],
    [10, "movement", 12, "create", 1, "admin", "10.10.1.10", "/api/upload", null, JSON.stringify({ itemId: 12, movementType: "in" }), null, formatDateTime(shiftDate({ months: 2, days: 10 }))],
    [11, "item", 14, "create", 1, "admin", "10.10.1.10", "/api/items", null, JSON.stringify({ name: "Webcam Logitech C920" }), JSON.stringify({ source: "seed-demo" }), formatDateTime(shiftDate({ months: 4, days: 5 }))],
    [12, "auth", 1, "login", 1, "admin", "10.10.1.10", "/api/auth/login", null, JSON.stringify({ username: "admin" }), null, formatDateTime(shiftDate({ hours: 5 }))],
  ];

  await insertRows(connection, "roles", ["id", "name", "description"], roles);
  await insertRows(connection, "permissions", ["id", "code", "description"], permissions);
  await insertRows(connection, "role_permissions", ["role_id", "permission_id"], rolePermissions);
  await insertRows(
    connection,
    "users",
    [
      "id",
      "username",
      "display_name",
      "email",
      "password_hash",
      "role_id",
      "active",
      "first_access_pending",
      "last_login_at",
      "deleted_at",
      "created_at",
      "updated_at",
    ],
    users,
  );
  await insertRows(connection, "user_permissions", ["user_id", "permission_id", "allowed"], userPermissions);
  await insertRows(connection, "sectors", ["id", "name", "description"], sectors);
  await insertRows(connection, "categories", ["id", "name", "description"], categories);
  await insertRows(
    connection,
    "items",
    [
      "id",
      "category_id",
      "name",
      "category",
      "asset_tag",
      "sku",
      "serial_number",
      "description",
      "responsible_name",
      "item_status",
      "location_name",
      "supplier_name",
      "invoice_number",
      "purchase_date",
      "purchase_value",
      "image_path",
      "qty_total",
      "qty_min",
      "deleted_at",
      "deleted_by",
      "created_at",
      "updated_at",
    ],
    items,
  );
  await insertRows(
    connection,
    "item_images",
    ["id", "item_id", "file_name", "file_path", "created_at"],
    itemImages,
  );
  await insertRows(
    connection,
    "stock_movements",
    [
      "id",
      "item_id",
      "movement_type",
      "quantity",
      "requested_by",
      "sector_id",
      "glpi_ticket_number",
      "glpi_comment_status",
      "notes",
      "created_at",
    ],
    movements,
  );
  await insertRows(
    connection,
    "audit_logs",
    [
      "id",
      "entity_type",
      "entity_id",
      "action",
      "actor_user_id",
      "actor_username",
      "ip_address",
      "route_path",
      "before_data",
      "after_data",
      "metadata_json",
      "created_at",
    ],
    auditLogs,
  );
}

async function printSummary(connection) {
  const tables = ["roles", "permissions", "users", "sectors", "categories", "items", "stock_movements", "audit_logs"];
  const parts = [];

  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM ${table}`);
    parts.push(`${table}=${rows[0].total}`);
  }

  console.log(`seed complete: ${parts.join(", ")}`);
}

async function run() {
  await loadEnvFile();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "",
    multipleStatements: true,
  });

  try {
    await connection.beginTransaction();
    await clearDemoTables(connection);
    await seedDemoData(connection);
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    await connection.commit();
    await printSummary(connection);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
    await connection.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});