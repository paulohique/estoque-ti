"use client";

import { useEffect, useMemo, useState } from "react";

type View = "dashboard" | "produtos" | "estoque" | "movimentacao" | "auditoria" | "permissoes";
type DashboardTab = "geral" | "mes" | "comparativo";
type MovementType = "in" | "out" | "transfer";

type Product = {
  id: number;
  name: string;
  category: string;
  assetTag?: string | null;
  sku?: string | null;
  description?: string | null;
  imagePath?: string | null;
  qtyTotal: number;
  qtyMin: number;
  createdAt?: string;
  updatedAt?: string;
};

type User = {
  id: number;
  displayName: string;
  email?: string | null;
  roleId: number;
};

type CategoryData = {
  label: string;
  value: number;
};

type RecentMovement = {
  id: number;
  itemId: number;
  itemName: string;
  movementType: MovementType;
  quantity: number;
  requestedByName: string;
  glpiTicketNumber?: string | null;
  notes?: string | null;
  createdAt: string;
};

type DashboardData = {
  metrics: {
    totalQty: number;
    distinct: number;
    critical: number;
    outsThisMonth: number;
  };
  months: Array<{ label: string; value: number }>;
  comparison: { current: number; previous: number };
  categories: CategoryData[];
  recentMovements: RecentMovement[];
};

type ProductFormState = {
  name: string;
  category: string;
  assetTag: string;
  sku: string;
  description: string;
  qtyTotal: string;
  qtyMin: string;
  image: File | null;
};

type MovementFormState = {
  movementType: MovementType;
  itemId: string;
  quantity: string;
  glpiTicketNumber: string;
  notes: string;
};

const titles: Record<View, [string, string]> = {
  dashboard: ["Dashboard", "Visao geral do estoque com dados reais"],
  produtos: ["Produtos", "Cadastro, patrimonio e imagem do item"],
  estoque: ["Estoque critico", "Itens em falta ou abaixo do minimo"],
  movimentacao: ["Movimentacao", "Entradas, saidas e transferencias persistidas"],
  auditoria: ["Auditoria", "Ultimas movimentacoes registradas no banco"],
  permissoes: ["Seguranca", "Sessao, cookie, JWT e permissoes ativas"],
};

const emptyProductForm = (): ProductFormState => ({
  name: "",
  category: "",
  assetTag: "",
  sku: "",
  description: "",
  qtyTotal: "",
  qtyMin: "",
  image: null,
});

const emptyMovementForm = (): MovementFormState => ({
  movementType: "out",
  itemId: "",
  quantity: "",
  glpiTicketNumber: "",
  notes: "",
});

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getMovementTypeLabel(type: MovementType) {
  if (type === "in") {
    return "Entrada";
  }
  if (type === "transfer") {
    return "Transferencia";
  }
  return "Saida";
}

function getMovementTagClass(type: MovementType) {
  if (type === "in") {
    return "tag-green";
  }
  if (type === "transfer") {
    return "tag-blue";
  }
  return "tag-red";
}

function getStockTagClass(item: Product) {
  if (item.qtyTotal === 0) {
    return "tag-red";
  }
  if (item.qtyTotal <= item.qtyMin) {
    return "tag-amber";
  }
  return "tag-green";
}

function getStockStatus(item: Product) {
  if (item.qtyTotal === 0) {
    return "Em falta";
  }
  if (item.qtyTotal <= item.qtyMin) {
    return "Baixo";
  }
  return "Normal";
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("geral");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductFormState>(emptyProductForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [movementForm, setMovementForm] = useState<MovementFormState>(emptyMovementForm);

  const hasPermission = (code: string) => permissions.includes(code);
  const canCreateItem = hasPermission("create_item");
  const canUpdateItem = hasPermission("update_item");
  const canMoveStock = hasPermission("withdraw_item");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return products;
    }

    return products.filter((item) =>
      [item.name, item.category, item.assetTag ?? "", item.sku ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, search]);

  const criticalItems = useMemo(
    () => products.filter((item) => item.qtyTotal === 0 || item.qtyTotal <= item.qtyMin),
    [products],
  );

  const latestItems = useMemo(() => products.slice(0, 5), [products]);

  const dashboardMetrics = dashboard?.metrics ?? {
    totalQty: 0,
    distinct: 0,
    critical: 0,
    outsThisMonth: 0,
  };
  const monthBars = dashboard?.months ?? [];
  const comparison = dashboard?.comparison ?? { current: 0, previous: 0 };
  const categories = dashboard?.categories ?? [];
  const recentMovements = dashboard?.recentMovements ?? [];

  const totalDelta =
    comparison.previous === 0
      ? comparison.current > 0
        ? 100
        : 0
      : Math.round(((comparison.current - comparison.previous) / comparison.previous) * 100);

  const chartBars = useMemo(() => {
    if (dashboardTab === "mes") {
      return [{ label: "Este mes", value: dashboardMetrics.outsThisMonth }];
    }

    if (dashboardTab === "comparativo") {
      return [
        { label: "Mes anterior", value: comparison.previous },
        { label: "Este mes", value: comparison.current },
      ];
    }

    return monthBars;
  }, [comparison.current, comparison.previous, dashboardMetrics.outsThisMonth, dashboardTab, monthBars]);

  const maxCategoryValue = Math.max(...categories.map((item) => item.value), 1);
  const maxChartValue = Math.max(...chartBars.map((item) => item.value), 1);

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);

    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    const data = (await response.json()) as T & { ok?: boolean; error?: string };
    if (typeof data === "object" && data !== null && "ok" in data && data.ok === false) {
      throw new Error(data.error ?? "Falha na requisicao");
    }

    return data as T;
  }

  async function loadInventoryData() {
    const [itemsData, dashboardData] = await Promise.all([
      fetchJson<{ ok: true; items: Product[] }>("/api/items"),
      fetchJson<{ ok: true; data: DashboardData }>("/api/dashboard"),
    ]);

    setProducts(itemsData.items);
    setDashboard(dashboardData.data);
  }

  async function bootstrap() {
    setError(null);

    try {
      const meData = await fetchJson<{ ok: true; user: User; permissions: string[] }>("/api/auth/me");
      setCurrentUser(meData.user);
      setPermissions(meData.permissions);
      await loadInventoryData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao carregar dados";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  async function refreshInventory() {
    setError(null);

    try {
      await loadInventoryData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao atualizar dados";
      setError(message);
    }
  }

  async function handleAddProduct() {
    if (!canCreateItem) {
      setError("Seu usuario nao possui permissao para cadastrar itens.");
      return;
    }

    if (!newProduct.name.trim() || !newProduct.category.trim()) {
      setError("Preencha nome e categoria do item.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("name", newProduct.name.trim());
      form.append("category", newProduct.category.trim());
      form.append("assetTag", newProduct.assetTag.trim());
      form.append("sku", newProduct.sku.trim());
      form.append("description", newProduct.description.trim());
      form.append("qtyTotal", String(toNumber(newProduct.qtyTotal)));
      form.append("qtyMin", String(toNumber(newProduct.qtyMin)));

      if (newProduct.image) {
        form.append("image", newProduct.image);
      }

      await fetchJson<{ ok: true }>("/api/items", {
        method: "POST",
        body: form,
      });

      setNewProduct(emptyProductForm());
      setProductModalOpen(false);
      await refreshInventory();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao salvar item";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEditProduct() {
    if (!selectedProduct) {
      return;
    }

    if (!canUpdateItem) {
      setError("Seu usuario nao possui permissao para editar itens.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("id", String(selectedProduct.id));
      form.append("name", selectedProduct.name.trim());
      form.append("category", selectedProduct.category.trim());
      form.append("assetTag", selectedProduct.assetTag?.trim() ?? "");
      form.append("sku", selectedProduct.sku?.trim() ?? "");
      form.append("description", selectedProduct.description?.trim() ?? "");
      form.append("imagePath", selectedProduct.imagePath ?? "");
      form.append("qtyTotal", String(selectedProduct.qtyTotal));
      form.append("qtyMin", String(selectedProduct.qtyMin));

      if (editImage) {
        form.append("image", editImage);
      }

      await fetchJson<{ ok: true }>("/api/items", {
        method: "PUT",
        body: form,
      });

      setEditModalOpen(false);
      setSelectedProduct(null);
      setEditImage(null);
      await refreshInventory();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao atualizar item";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleMovementSubmit() {
    if (!canMoveStock) {
      setError("Seu usuario nao possui permissao para movimentar estoque.");
      return;
    }

    if (!movementForm.itemId) {
      setError("Selecione um item para movimentar.");
      return;
    }

    const quantity = toNumber(movementForm.quantity);
    if (quantity <= 0) {
      setError("Informe uma quantidade maior que zero.");
      return;
    }

    if (movementForm.movementType === "out" && !movementForm.glpiTicketNumber.trim()) {
      setError("Chamado GLPI obrigatorio para saida.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await fetchJson<{ ok: true }>("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: Number(movementForm.itemId),
          movementType: movementForm.movementType,
          quantity,
          glpiTicketNumber: movementForm.glpiTicketNumber.trim(),
          notes: movementForm.notes.trim(),
          confirmed: true,
        }),
      });

      setMovementForm(emptyMovementForm());
      await refreshInventory();
      setView("dashboard");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao registrar movimentacao";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function openEditModal(item: Product) {
    setSelectedProduct({ ...item });
    setEditImage(null);
    setEditModalOpen(true);
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="brand">
          <div className="brand-name">TI Inventario</div>
          <div className="brand-sub">sessao ativa com JWT</div>
        </div>

        <div className="nav">
          <div className="nav-section">Principal</div>
          <div className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
            Dashboard
          </div>
          <div className={`nav-item ${view === "produtos" ? "active" : ""}`} onClick={() => setView("produtos")}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="10" rx="1" />
              <path d="M2 7h12" />
            </svg>
            Produtos
          </div>
          <div className={`nav-item ${view === "estoque" ? "active" : ""}`} onClick={() => setView("estoque")}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1 14 4.5v7L8 15 2 11.5v-7L8 1Z" />
              <path d="M8 8v7M8 8l6-3.5M8 8 2 4.5" />
            </svg>
            Estoque
            <span className="nav-badge">{dashboardMetrics.critical}</span>
          </div>

          <div className="nav-section">Operacoes</div>
          <div className={`nav-item ${view === "movimentacao" ? "active" : ""}`} onClick={() => setView("movimentacao")}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10" />
              <path d="m9 4 4 4-4 4" />
            </svg>
            Movimentacao
          </div>
          <div className={`nav-item ${view === "auditoria" ? "active" : ""}`} onClick={() => setView("auditoria")}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="m10 10 4 4" />
            </svg>
            Auditoria
          </div>

          <div className="nav-section">Acesso</div>
          <div className={`nav-item ${view === "permissoes" ? "active" : ""}`} onClick={() => setView("permissoes")}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1 3 3v4c0 3.2 2 6 5 8 3-2 5-4.8 5-8V3L8 1Z" />
              <path d="M6.5 8 8 9.5 10.5 6.5" />
            </svg>
            Seguranca
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-row user-menu" onClick={() => setUserMenuOpen((open) => !open)}>
            <div className="avatar">{currentUser?.displayName?.slice(0, 2).toUpperCase() ?? "TI"}</div>
            <div>
              <div className="user-name">{currentUser?.displayName ?? "Carregando"}</div>
              <div className="user-role">{currentUser?.email ?? "usuario autenticado"}</div>
            </div>
          </div>
          {userMenuOpen && (
            <div className="user-menu-dropdown">
              <button onClick={handleLogout}>Sair</button>
            </div>
          )}
        </div>
      </nav>

      <div className="main">
        <div className="topbar">
          <span className="page-title">{titles[view][0]}</span>
          <span className="page-sub">{titles[view][1]}</span>
          <div className="topbar-right">
            <div className="search-bar">
              <span className="search-icon">/</span>
              <input
                placeholder="Buscar por nome, categoria, patrimonio ou SKU"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {canCreateItem && (
              <button className="btn btn-primary" onClick={() => setProductModalOpen(true)}>
                + Novo item
              </button>
            )}
          </div>
        </div>

        <div className="content">
          {loading && <div className="loading">Carregando dados reais do banco...</div>}
          {error && <div className="status-banner status-error">{error}</div>}
          {!loading && !error && (
            <>
              {view === "dashboard" && (
                <div className="view active">
                  <div className="tabs">
                    <div className={`tab ${dashboardTab === "geral" ? "active" : ""}`} onClick={() => setDashboardTab("geral")}>
                      Geral
                    </div>
                    <div className={`tab ${dashboardTab === "mes" ? "active" : ""}`} onClick={() => setDashboardTab("mes")}>
                      Este mes
                    </div>
                    <div className={`tab ${dashboardTab === "comparativo" ? "active" : ""}`} onClick={() => setDashboardTab("comparativo")}>
                      Comparativo
                    </div>
                  </div>

                  <div className="metrics">
                    <div className="metric">
                      <div className="metric-label">Total em estoque</div>
                      <div className="metric-icon icon-blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                          <path d="M12 12v9M12 12l8-4.5M12 12 4 7.5" />
                        </svg>
                      </div>
                      <div className="metric-value">{dashboardMetrics.totalQty}</div>
                      <div className="metric-delta delta-up">Saldo persistido em banco</div>
                    </div>

                    <div className="metric">
                      <div className="metric-label">Produtos distintos</div>
                      <div className="metric-icon icon-green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="4" y="5" width="16" height="14" rx="2" />
                          <path d="M8 9h8M8 13h5" />
                        </svg>
                      </div>
                      <div className="metric-value">{dashboardMetrics.distinct}</div>
                      <div className="metric-delta delta-up">Cadastro sincronizado</div>
                    </div>

                    <div className="metric">
                      <div className="metric-label">Saidas registradas</div>
                      <div className="metric-icon icon-amber">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 12h12" />
                          <path d="m12 6 6 6-6 6" />
                        </svg>
                      </div>
                      <div className="metric-value">
                        {dashboardTab === "comparativo" ? comparison.current : dashboardMetrics.outsThisMonth}
                      </div>
                      <div className={`metric-delta ${totalDelta >= 0 ? "delta-up" : "delta-down"}`}>
                        {dashboardTab === "comparativo"
                          ? `${totalDelta >= 0 ? "Subiu" : "Caiu"} ${Math.abs(totalDelta)}% vs mes anterior`
                          : "Atualizado pelas movimentacoes"}
                      </div>
                    </div>

                    <div className="metric">
                      <div className="metric-label">Criticos</div>
                      <div className="metric-icon icon-red">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 3 2 20h20L12 3Z" />
                          <path d="M12 9v4" />
                          <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
                        </svg>
                      </div>
                      <div className="metric-value">{dashboardMetrics.critical}</div>
                      <div className="metric-delta delta-down">Itens abaixo do minimo</div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Saidas de material</span>
                        <span className="card-action">{dashboardTab === "geral" ? "ultimos 6 meses" : "recorte atual"}</span>
                      </div>
                      <div className="chart-bars">
                        {chartBars.map((bar, index) => (
                          <div className="bar-group" key={`${bar.label}-${index}`}>
                            <div className="bar-val">{bar.value}</div>
                            <div
                              className={`bar ${index % 2 === 0 ? "bar-blue-l" : "bar-blue"}`}
                              style={{ height: Math.max(14, Math.round((bar.value / maxChartValue) * 100)) }}
                            />
                            <div className="bar-label">{bar.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Categorias mais cadastradas</span>
                        <span className="card-action">{categories.length} categorias</span>
                      </div>
                      <div className="legend">
                        {categories.length === 0 && <div className="empty-state">Nenhum item cadastrado ainda.</div>}
                        {categories.slice(0, 5).map((category) => (
                          <div className="category-row" key={category.label}>
                            <div className="category-head">
                              <span className="legend-label">{category.label}</span>
                              <span className="legend-val">{category.value}</span>
                            </div>
                            <div className="category-track">
                              <div
                                className="category-fill"
                                style={{ width: `${Math.max(8, Math.round((category.value / maxCategoryValue) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Ultimos cadastros</span>
                        <span className="card-action" onClick={() => setView("produtos")}>
                          Ver produtos
                        </span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Produto</th>
                              <th>Categoria</th>
                              <th>Patrimonio</th>
                              <th>Qtd</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {latestItems.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <b>{item.name}</b>
                                </td>
                                <td>{item.category}</td>
                                <td>{item.assetTag || "-"}</td>
                                <td>{item.qtyTotal}</td>
                                <td>
                                  <span className={`tag ${getStockTagClass(item)}`}>{getStockStatus(item)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Ultimas movimentacoes</span>
                        <span className="card-action" onClick={() => setView("auditoria")}>
                          Abrir auditoria
                        </span>
                      </div>
                      <div className="audit-list">
                        {recentMovements.length === 0 && <div className="empty-state">Nenhuma movimentacao registrada.</div>}
                        {recentMovements.slice(0, 4).map((movement) => (
                          <div className="audit-item" key={movement.id}>
                            <div className={`audit-dot ${getMovementTagClass(movement.movementType)}`} />
                            <div className="audit-line">
                              <div className="audit-action">
                                {getMovementTypeLabel(movement.movementType)} - {movement.itemName} x {movement.quantity}
                              </div>
                              <div className="audit-meta">
                                {movement.requestedByName}
                                {movement.glpiTicketNumber ? ` - GLPI ${movement.glpiTicketNumber}` : ""}
                              </div>
                            </div>
                            <div className="audit-time">{formatDateTime(movement.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === "produtos" && (
                <div className="view active">
                  <div className="prod-grid">
                    {filteredProducts.map((item) => (
                      <div className="prod-card" key={item.id}>
                        <div className="prod-media">
                          <div className="prod-img">
                            {item.imagePath ? <img src={item.imagePath} alt={item.name} /> : <span className="prod-placeholder">IMG</span>}
                          </div>
                          <div className="prod-side-actions">
                            {canUpdateItem && (
                              <button className="icon-btn" onClick={() => openEditModal(item)} title="Editar item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
                                  <path d="m13.5 6.5 3 3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="prod-body">
                          <div className="prod-name">{item.name}</div>
                          <div className="prod-cat">{item.category}</div>
                          <div className="prod-meta">{item.assetTag ? `Patrimonio: ${item.assetTag}` : "Sem patrimonio informado"}</div>
                          <div className="prod-meta">{item.sku ? `SKU: ${item.sku}` : "SKU nao informado"}</div>
                          <div className="prod-footer">
                            <div className="prod-qty">{item.qtyTotal} un.</div>
                            <span className={`tag ${getStockTagClass(item)}`}>{getStockStatus(item)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {canCreateItem && (
                      <div className="prod-card prod-add" onClick={() => setProductModalOpen(true)}>
                        <div className="prod-add-icon">+</div>
                        <div className="prod-add-label">Adicionar produto</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === "estoque" && (
                <div className="view active">
                  <div className="alert-banner">
                    <div>
                      <div className="alert-title">{criticalItems.length} itens com estoque critico</div>
                      <div className="alert-sub">Esses produtos ja estao impactando os indicadores do dashboard.</div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Produtos em falta ou abaixo do minimo</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Patrimonio</th>
                            <th>Qtd atual</th>
                            <th>Qtd minima</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {criticalItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <b>{item.name}</b>
                              </td>
                              <td>{item.category}</td>
                              <td>{item.assetTag || "-"}</td>
                              <td>{item.qtyTotal}</td>
                              <td>{item.qtyMin}</td>
                              <td>
                                <span className={`tag ${getStockTagClass(item)}`}>{getStockStatus(item)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {view === "movimentacao" && (
                <div className="view active">
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Registrar movimentacao</span>
                        <span className="card-action">Persistencia imediata no MySQL</span>
                      </div>

                      <div className="form-grid">
                        <div>
                          <label>Tipo</label>
                          <select
                            value={movementForm.movementType}
                            onChange={(event) =>
                              setMovementForm((current) => ({
                                ...current,
                                movementType: event.target.value as MovementType,
                              }))
                            }
                          >
                            <option value="out">Saida</option>
                            <option value="in">Entrada</option>
                            <option value="transfer">Transferencia</option>
                          </select>
                        </div>

                        <div>
                          <label>Produto</label>
                          <select
                            value={movementForm.itemId}
                            onChange={(event) =>
                              setMovementForm((current) => ({ ...current, itemId: event.target.value }))
                            }
                          >
                            <option value="">Selecione um item</option>
                            {products.map((item) => (
                              <option value={item.id} key={item.id}>
                                {item.name} - saldo {item.qtyTotal}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-row">
                          <div>
                            <label>Quantidade</label>
                            <input
                              type="number"
                              min="1"
                              value={movementForm.quantity}
                              onChange={(event) =>
                                setMovementForm((current) => ({ ...current, quantity: event.target.value }))
                              }
                            />
                          </div>

                          <div>
                            <label>GLPI</label>
                            <input
                              placeholder={movementForm.movementType === "out" ? "Obrigatorio para saida" : "Opcional"}
                              value={movementForm.glpiTicketNumber}
                              onChange={(event) =>
                                setMovementForm((current) => ({
                                  ...current,
                                  glpiTicketNumber: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label>Observacao</label>
                          <textarea
                            rows={3}
                            value={movementForm.notes}
                            onChange={(event) =>
                              setMovementForm((current) => ({ ...current, notes: event.target.value }))
                            }
                          />
                        </div>

                        <button className="btn btn-primary" onClick={handleMovementSubmit} disabled={busy}>
                          {busy ? "Gravando..." : "Registrar movimentacao"}
                        </button>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Movimentacoes recentes</span>
                      </div>
                      <div className="audit-list">
                        {recentMovements.length === 0 && <div className="empty-state">Nada registrado ainda.</div>}
                        {recentMovements.map((movement) => (
                          <div className="audit-item" key={movement.id}>
                            <div className={`audit-dot ${getMovementTagClass(movement.movementType)}`} />
                            <div className="audit-line">
                              <div className="audit-action">
                                {getMovementTypeLabel(movement.movementType)} - {movement.itemName} x {movement.quantity}
                              </div>
                              <div className="audit-meta">{movement.notes || movement.requestedByName}</div>
                            </div>
                            <div className="audit-time">{formatDateTime(movement.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === "auditoria" && (
                <div className="view active">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Ultimas movimentacoes persistidas</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Produto</th>
                            <th>Qtd</th>
                            <th>Usuario</th>
                            <th>GLPI</th>
                            <th>Observacao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentMovements.map((movement) => (
                            <tr key={movement.id}>
                              <td>{formatDateTime(movement.createdAt)}</td>
                              <td>
                                <span className={`tag ${getMovementTagClass(movement.movementType)}`}>
                                  {getMovementTypeLabel(movement.movementType)}
                                </span>
                              </td>
                              <td>{movement.itemName}</td>
                              <td>{movement.quantity}</td>
                              <td>{movement.requestedByName}</td>
                              <td>{movement.glpiTicketNumber || "-"}</td>
                              <td>{movement.notes || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {view === "permissoes" && (
                <div className="view active">
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Protecoes ativas</span>
                      </div>
                      <div className="security-list">
                        <div className="security-item">
                          <div className="security-title">Sessao por cookie httpOnly</div>
                          <div className="security-sub">O token JWT fica em cookie protegido e nao exposto no front.</div>
                        </div>
                        <div className="security-item">
                          <div className="security-title">JWT validado no middleware</div>
                          <div className="security-sub">Acesso direto por link sem autenticar redireciona para /login.</div>
                        </div>
                        <div className="security-item">
                          <div className="security-title">Permissoes checadas nas rotas</div>
                          <div className="security-sub">Itens, dashboard e movimentacoes exigem sessao valida e permissao.</div>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Permissoes do usuario atual</span>
                      </div>
                      <div className="permission-tags">
                        {permissions.map((permission) => (
                          <span className="tag tag-blue" key={permission}>
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {productModalOpen && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Novo item</div>
              <button className="modal-close" onClick={() => setProductModalOpen(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div>
                  <label>Nome</label>
                  <input
                    value={newProduct.name}
                    onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Categoria</label>
                  <input
                    value={newProduct.category}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, category: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>Patrimonio (opcional)</label>
                  <input
                    value={newProduct.assetTag}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, assetTag: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>SKU (opcional)</label>
                  <input
                    value={newProduct.sku}
                    onChange={(event) => setNewProduct((current) => ({ ...current, sku: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Descricao</label>
                  <textarea
                    rows={3}
                    value={newProduct.description}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>Imagem do produto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setNewProduct((current) => ({
                        ...current,
                        image: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </div>
                <div className="form-row">
                  <div>
                    <label>Quantidade</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.qtyTotal}
                      onChange={(event) =>
                        setNewProduct((current) => ({ ...current, qtyTotal: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Quantidade minima</label>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.qtyMin}
                      onChange={(event) =>
                        setNewProduct((current) => ({ ...current, qtyMin: event.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setProductModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAddProduct} disabled={busy}>
                {busy ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedProduct && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Editar item</div>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div>
                  <label>Nome</label>
                  <input
                    value={selectedProduct.name}
                    onChange={(event) =>
                      setSelectedProduct((current) => (current ? { ...current, name: event.target.value } : current))
                    }
                  />
                </div>
                <div>
                  <label>Categoria</label>
                  <input
                    value={selectedProduct.category}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, category: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Patrimonio</label>
                  <input
                    value={selectedProduct.assetTag ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, assetTag: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>SKU</label>
                  <input
                    value={selectedProduct.sku ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, sku: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Descricao</label>
                  <textarea
                    rows={3}
                    value={selectedProduct.description ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, description: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Nova imagem do produto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditImage(event.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="form-row">
                  <div>
                    <label>Quantidade</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedProduct.qtyTotal}
                      onChange={(event) =>
                        setSelectedProduct((current) =>
                          current ? { ...current, qtyTotal: toNumber(event.target.value) } : current,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label>Quantidade minima</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedProduct.qtyMin}
                      onChange={(event) =>
                        setSelectedProduct((current) =>
                          current ? { ...current, qtyMin: toNumber(event.target.value) } : current,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleEditProduct} disabled={busy}>
                {busy ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
