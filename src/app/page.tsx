"use client";

import { useEffect, useMemo, useState } from "react";

type View = "dashboard" | "produtos" | "estoque" | "movimentacao" | "auditoria" | "setores" | "categorias" | "permissoes";
type DashboardTab = "geral" | "mes" | "comparativo";
type MovementType = "in" | "out" | "transfer";

type Product = {
  id: number;
  categoryId?: number | null;
  name: string;
  category: string;
  assetTag?: string | null;
  sku?: string | null;
  serialNumber?: string | null;
  description?: string | null;
  responsibleName?: string | null;
  itemStatus?: string;
  locationName?: string | null;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  purchaseDate?: string | null;
  purchaseValue?: number | null;
  imagePath?: string | null;
  qtyTotal: number;
  qtyMin: number;
  createdAt?: string;
  updatedAt?: string;
};

type User = {
  id: number;
  displayName: string;
  username?: string;
  email?: string | null;
  roleId: number;
  roleName?: string | null;
  firstAccessPending?: boolean;
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
  sectorName?: string | null;
  glpiTicketNumber?: string | null;
  glpiCommentStatus?: string | null;
  notes?: string | null;
  createdAt: string;
};

type Sector = {
  id: number;
  name: string;
  description?: string | null;
};

type CategoryOption = {
  id: number;
  name: string;
  description?: string | null;
};

type AccessRole = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: string[];
};

type AccessPermission = {
  id: number;
  code: string;
  description?: string | null;
};

type ManagedUser = User & {
  username: string;
  active: boolean;
  firstAccessPending: boolean;
  overrides: Array<{ code: string; allowed: boolean }>;
  effectivePermissions: string[];
};

type UserOverrideState = {
  code: string;
  mode: "inherit" | "allow" | "deny";
};

type AuditLogEntry = {
  id: number;
  entityType: string;
  entityId?: number | null;
  action: string;
  actorUserId?: number | null;
  actorUsername?: string | null;
  ipAddress?: string | null;
  routePath?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  createdAt: string;
};

type SectorMovementData = {
  sectorId: number;
  sectorName: string;
  movementCount: number;
  totalQuantity: number;
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
  sectorMovements: SectorMovementData[];
  topMovedItems: Array<{
    itemId: number;
    itemName: string;
    assetTag?: string | null;
    category: string;
    movementCount: number;
    totalQuantity: number;
  }>;
  staleItems: Array<{
    itemId: number;
    itemName: string;
    assetTag?: string | null;
    category: string;
    qtyTotal: number;
    lastOutAt?: string | null;
    daysWithoutOut?: number | null;
  }>;
  assetHistory: Array<{
    itemId: number;
    itemName: string;
    assetTag: string;
    sectorName: string;
    movementType: "out" | "transfer";
    movementCount: number;
    totalQuantity: number;
    lastMovementAt: string;
  }>;
};

type ProductFormState = {
  name: string;
  categoryId: string;
  assetTag: string;
  sku: string;
  serialNumber: string;
  description: string;
  responsibleName: string;
  itemStatus: string;
  locationName: string;
  supplierName: string;
  invoiceNumber: string;
  purchaseDate: string;
  purchaseValue: string;
  qtyTotal: string;
  qtyMin: string;
  image: File | null;
};

type MovementFormState = {
  movementType: MovementType;
  itemId: string;
  sectorId: string;
  quantity: string;
  glpiTicketNumber: string;
  notes: string;
};

type SectorFormState = {
  id?: number;
  name: string;
  description: string;
};

type CategoryFormState = {
  id?: number;
  name: string;
  description: string;
};

type UserAccessFormState = {
  id?: number;
  roleId: string;
  active: boolean;
  firstAccessPending: boolean;
  overrides: UserOverrideState[];
};

type RoleAccessFormState = {
  id?: number;
  permissionCodes: string[];
};

type DashboardFilterState = {
  dateFrom: string;
  dateTo: string;
  sectorId: string;
  categoryId: string;
};

const titles: Record<View, [string, string]> = {
  dashboard: ["Dashboard", "Visao geral do estoque com dados reais"],
  produtos: ["Produtos", "Cadastro, patrimonio e imagem do item"],
  estoque: ["Estoque critico", "Itens em falta ou abaixo do minimo"],
  movimentacao: ["Movimentacao", "Entradas, saidas e transferencias persistidas"],
  auditoria: ["Auditoria", "Ultimas movimentacoes registradas no banco"],
  setores: ["Setores", "CRUD de setores e secretarias"],
  categorias: ["Categorias", "CRUD de categorias vinculadas aos produtos"],
  permissoes: ["Seguranca", "Sessao, cookie, JWT e permissoes ativas"],
};

const emptyProductForm = (): ProductFormState => ({
  name: "",
  categoryId: "",
  assetTag: "",
  sku: "",
  serialNumber: "",
  description: "",
  responsibleName: "",
  itemStatus: "em_estoque",
  locationName: "",
  supplierName: "",
  invoiceNumber: "",
  purchaseDate: "",
  purchaseValue: "",
  qtyTotal: "",
  qtyMin: "",
  image: null,
});

const emptyMovementForm = (): MovementFormState => ({
  movementType: "out",
  itemId: "",
  sectorId: "",
  quantity: "",
  glpiTicketNumber: "",
  notes: "",
});

const emptySectorForm = (): SectorFormState => ({
  name: "",
  description: "",
});

const emptyCategoryForm = (): CategoryFormState => ({
  name: "",
  description: "",
});

const emptyUserAccessForm = (): UserAccessFormState => ({
  roleId: "",
  active: true,
  firstAccessPending: true,
  overrides: [],
});

const emptyDashboardFilters = (): DashboardFilterState => ({
  dateFrom: "",
  dateTo: "",
  sectorId: "",
  categoryId: "",
});

const emptyRoleAccessForm = (): RoleAccessFormState => ({
  permissionCodes: [],
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

function getOverrideMode(
  overrides: Array<{ code: string; allowed: boolean }>,
  code: string,
): UserOverrideState["mode"] {
  const override = overrides.find((item) => item.code === code);
  if (!override) {
    return "inherit";
  }
  return override.allowed ? "allow" : "deny";
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("geral");
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilterState>(emptyDashboardFilters);
  const [search, setSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [itemCategories, setItemCategories] = useState<CategoryOption[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [accessRoles, setAccessRoles] = useState<AccessRole[]>([]);
  const [accessPermissions, setAccessPermissions] = useState<AccessPermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [userAccessModalOpen, setUserAccessModalOpen] = useState(false);
  const [roleAccessModalOpen, setRoleAccessModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductFormState>(emptyProductForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [sectorForm, setSectorForm] = useState<SectorFormState>(emptySectorForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [userAccessForm, setUserAccessForm] = useState<UserAccessFormState>(emptyUserAccessForm);
  const [roleAccessForm, setRoleAccessForm] = useState<RoleAccessFormState>(emptyRoleAccessForm);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [movementForm, setMovementForm] = useState<MovementFormState>(emptyMovementForm);
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [glpiWarningTicketId, setGlpiWarningTicketId] = useState<string | null>(null);
  const [selectedManagedUser, setSelectedManagedUser] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AccessRole | null>(null);

  const hasPermission = (code: string) => permissions.includes(code);
  const canCreateItem = hasPermission("create_item");
  const canUpdateItem = hasPermission("update_item");
  const canDeleteItem = hasPermission("delete_item");
  const canMoveStock = hasPermission("withdraw_item");
  const canViewItems = hasPermission("view_items");
  const canViewAudit = hasPermission("audit_log");
  const canManageCategories = hasPermission("manage_categories");
  const canManageSectors = hasPermission("manage_sectors");
  const canManageUsers = hasPermission("manage_users");

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

  const pageSize = 8;
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, productPage]);

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
  const categoryStats = dashboard?.categories ?? [];
  const recentMovements = dashboard?.recentMovements ?? [];
  const sectorMovements = dashboard?.sectorMovements ?? [];
  const topMovedItems = dashboard?.topMovedItems ?? [];
  const staleItems = dashboard?.staleItems ?? [];
  const assetHistory = dashboard?.assetHistory ?? [];

  const selectedSectorStats = useMemo(() => {
    if (!selectedSectorId) {
      return sectorMovements[0] ?? null;
    }

    return sectorMovements.find((item) => item.sectorId === Number(selectedSectorId)) ?? null;
  }, [sectorMovements, selectedSectorId]);

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

  const maxCategoryValue = Math.max(...categoryStats.map((item) => item.value), 1);
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

  async function loadInventoryData(currentPermissions: string[] = permissions) {
    const currentCanViewItems = currentPermissions.includes("view_items");
    const currentCanMoveStock = currentPermissions.includes("withdraw_item");
    const currentCanManageCategories = currentPermissions.includes("manage_categories");
    const currentCanManageSectors = currentPermissions.includes("manage_sectors");
    const currentCanManageUsers = currentPermissions.includes("manage_users");
    const dashboardQuery = new URLSearchParams();

    if (dashboardFilters.dateFrom) {
      dashboardQuery.set("dateFrom", dashboardFilters.dateFrom);
    }
    if (dashboardFilters.dateTo) {
      dashboardQuery.set("dateTo", dashboardFilters.dateTo);
    }
    if (dashboardFilters.sectorId) {
      dashboardQuery.set("sectorId", dashboardFilters.sectorId);
    }
    if (dashboardFilters.categoryId) {
      dashboardQuery.set("categoryId", dashboardFilters.categoryId);
    }

    const requests: Array<Promise<void>> = [
      fetchJson<{ ok: true; data: DashboardData }>(`/api/dashboard${dashboardQuery.toString() ? `?${dashboardQuery.toString()}` : ""}`).then((dashboardData) => {
        setDashboard(dashboardData.data);
      }),
    ];

    if (currentCanViewItems) {
      requests.push(
        fetchJson<{ ok: true; items: Product[] }>("/api/items").then((itemsData) => {
          setProducts(itemsData.items);
        }),
      );
    } else {
      setProducts([]);
    }

    if (currentCanViewItems || currentCanManageCategories) {
      requests.push(
        fetchJson<{ ok: true; categories: CategoryOption[] }>("/api/categories").then((categoriesData) => {
          setItemCategories(categoriesData.categories);
        }),
      );
    } else {
      setItemCategories([]);
    }

    if (currentCanViewItems || currentCanMoveStock || currentCanManageSectors) {
      requests.push(
        fetchJson<{ ok: true; sectors: Sector[] }>("/api/sectors").then((sectorsData) => {
          setSectors(sectorsData.sectors);
          setSelectedSectorId((current) => {
            if (current && sectorsData.sectors.some((sector) => sector.id === Number(current))) {
              return current;
            }
            return sectorsData.sectors[0] ? String(sectorsData.sectors[0].id) : "";
          });
        }),
      );
    } else {
      setSectors([]);
      setSelectedSectorId("");
    }

    if (currentCanManageUsers) {
      requests.push(
        fetchJson<{
          ok: true;
          users: ManagedUser[];
          roles: AccessRole[];
          permissions: AccessPermission[];
        }>("/api/access").then((accessData) => {
          setManagedUsers(accessData.users);
          setAccessRoles(accessData.roles);
          setAccessPermissions(accessData.permissions);
        }),
      );
    } else {
      setManagedUsers([]);
      setAccessRoles([]);
      setAccessPermissions([]);
    }

    if (currentPermissions.includes("audit_log")) {
      requests.push(
        fetchJson<{ ok: true; logs: AuditLogEntry[] }>("/api/audit?limit=100").then((auditData) => {
          setAuditLogs(auditData.logs);
        }),
      );
    } else {
      setAuditLogs([]);
    }

    await Promise.all(requests);
  }

  async function bootstrap() {
    setError(null);
    setNotice(null);

    try {
      const meData = await fetchJson<{ ok: true; user: User; permissions: string[] }>("/api/auth/me");
      setCurrentUser(meData.user);
      setPermissions(meData.permissions);
      await loadInventoryData(meData.permissions);
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

  useEffect(() => {
    if (search.trim() && canViewItems) {
      setView("produtos");
    }
  }, [search, canViewItems]);

  useEffect(() => {
    setProductPage(1);
  }, [search]);

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(totalProductPages);
    }
  }, [productPage, totalProductPages]);

  useEffect(() => {
    if (!loading) {
      void refreshInventory();
    }
  }, [dashboardFilters]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  async function refreshInventory() {
    setError(null);
    setNotice(null);

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

    setNotice(null);

    if (!newProduct.name.trim() || !newProduct.categoryId) {
      setError("Preencha nome e selecione a categoria do item.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const selectedCategory = itemCategories.find((category) => category.id === Number(newProduct.categoryId));
      if (!selectedCategory) {
        throw new Error("Categoria invalida");
      }

      const form = new FormData();
      form.append("name", newProduct.name.trim());
      form.append("categoryId", newProduct.categoryId);
      form.append("category", selectedCategory.name);
      form.append("assetTag", newProduct.assetTag.trim());
      form.append("sku", newProduct.sku.trim());
      form.append("serialNumber", newProduct.serialNumber.trim());
      form.append("description", newProduct.description.trim());
      form.append("responsibleName", newProduct.responsibleName.trim());
      form.append("itemStatus", newProduct.itemStatus);
      form.append("locationName", newProduct.locationName.trim());
      form.append("supplierName", newProduct.supplierName.trim());
      form.append("invoiceNumber", newProduct.invoiceNumber.trim());
      form.append("purchaseDate", newProduct.purchaseDate);
      form.append("purchaseValue", newProduct.purchaseValue.trim());
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
    setNotice(null);

    try {
      if (!selectedProduct.categoryId) {
        throw new Error("Selecione uma categoria valida para o produto");
      }

      const selectedCategory = itemCategories.find((category) => category.id === selectedProduct.categoryId);
      if (!selectedCategory) {
        throw new Error("Categoria invalida");
      }

      const form = new FormData();
      form.append("id", String(selectedProduct.id));
      form.append("name", selectedProduct.name.trim());
      form.append("categoryId", String(selectedProduct.categoryId));
      form.append("category", selectedCategory.name);
      form.append("assetTag", selectedProduct.assetTag?.trim() ?? "");
      form.append("sku", selectedProduct.sku?.trim() ?? "");
      form.append("serialNumber", selectedProduct.serialNumber?.trim() ?? "");
      form.append("description", selectedProduct.description?.trim() ?? "");
      form.append("responsibleName", selectedProduct.responsibleName?.trim() ?? "");
      form.append("itemStatus", selectedProduct.itemStatus ?? "em_estoque");
      form.append("locationName", selectedProduct.locationName?.trim() ?? "");
      form.append("supplierName", selectedProduct.supplierName?.trim() ?? "");
      form.append("invoiceNumber", selectedProduct.invoiceNumber?.trim() ?? "");
      form.append("purchaseDate", selectedProduct.purchaseDate ?? "");
      form.append("purchaseValue", selectedProduct.purchaseValue != null ? String(selectedProduct.purchaseValue) : "");
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

    setNotice(null);

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
      const response = await fetchJson<{
        ok: true;
        glpiCommentStatus?: string;
        glpiError?: string | null;
      }>("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: Number(movementForm.itemId),
          movementType: movementForm.movementType,
          sectorId: movementForm.sectorId ? Number(movementForm.sectorId) : null,
          quantity,
          glpiTicketNumber: movementForm.glpiTicketNumber.trim(),
          notes: movementForm.notes.trim(),
          confirmed: true,
        }),
      });

      const ticketId = movementForm.glpiTicketNumber.trim();
      setMovementForm(emptyMovementForm());
      await refreshInventory();
      if (response.glpiError) {
        setGlpiWarningTicketId(ticketId);
      } else if (ticketId) {
        setNotice("Movimentacao salva e comentario enviado ao chamado GLPI.");
      } else {
        setNotice("Movimentacao salva com sucesso.");
      }
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

  function clearSearch() {
    setSearch("");
  }

  function openDeleteProductModal(item: Product) {
    setProductPendingDelete(item);
  }

  async function handleDeleteProduct() {
    if (!productPendingDelete) {
      return;
    }

    if (!canDeleteItem) {
      setError("Seu usuario nao possui permissao para excluir itens.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const result = await fetchJson<{
        ok: true;
        relations: { movementCount: number; imageCount: number };
      }>(`/api/items?id=${productPendingDelete.id}`, {
        method: "DELETE",
      });

      setProductPendingDelete(null);
      await refreshInventory();
      setNotice(
        `Produto inativado com sucesso. Historico preservado com ${result.relations.movementCount} movimentacoes e ${result.relations.imageCount} imagens relacionadas.`,
      );
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao excluir produto";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function openCreateSectorModal() {
    setSectorForm(emptySectorForm());
    setSectorModalOpen(true);
  }

  function openEditSectorModal(sector: Sector) {
    setSectorForm({
      id: sector.id,
      name: sector.name,
      description: sector.description ?? "",
    });
    setSectorModalOpen(true);
  }

  async function handleSaveSector() {
    if (!canManageSectors) {
      setError("Seu usuario nao possui permissao para gerenciar setores.");
      return;
    }

    if (!sectorForm.name.trim()) {
      setError("Informe o nome do setor.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (sectorForm.id) {
        await fetchJson<{ ok: true }>("/api/sectors", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sectorForm),
        });
      } else {
        await fetchJson<{ ok: true }>("/api/sectors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sectorForm),
        });
      }

      setSectorModalOpen(false);
      setSectorForm(emptySectorForm());
      await refreshInventory();
      setNotice("Setor salvo com sucesso.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao salvar setor";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSector(id: number) {
    if (!canManageSectors) {
      setError("Seu usuario nao possui permissao para excluir setores.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await fetchJson<{ ok: true }>(`/api/sectors?id=${id}`, {
        method: "DELETE",
      });
      await refreshInventory();
      setNotice("Setor removido com sucesso.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao excluir setor";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function openCreateCategoryModal() {
    setCategoryForm(emptyCategoryForm());
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(category: CategoryOption) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
    });
    setCategoryModalOpen(true);
  }

  async function handleSaveCategory() {
    if (!canManageCategories) {
      setError("Seu usuario nao possui permissao para gerenciar categorias.");
      return;
    }

    if (!categoryForm.name.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (categoryForm.id) {
        await fetchJson<{ ok: true }>("/api/categories", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryForm),
        });
      } else {
        await fetchJson<{ ok: true }>("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryForm),
        });
      }

      setCategoryModalOpen(false);
      setCategoryForm(emptyCategoryForm());
      await refreshInventory();
      setNotice("Categoria salva com sucesso.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao salvar categoria";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!canManageCategories) {
      setError("Seu usuario nao possui permissao para excluir categorias.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await fetchJson<{ ok: true }>(`/api/categories?id=${id}`, {
        method: "DELETE",
      });
      await refreshInventory();
      setNotice("Categoria removida com sucesso.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao excluir categoria";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function openUserAccessModal(user: ManagedUser) {
    setSelectedManagedUser(user);
    setUserAccessForm({
      id: user.id,
      roleId: String(user.roleId),
      active: user.active,
      firstAccessPending: user.firstAccessPending,
      overrides: accessPermissions.map((permission) => ({
        code: permission.code,
        mode: getOverrideMode(user.overrides, permission.code),
      })),
    });
    setUserAccessModalOpen(true);
  }

  async function handleSaveUserAccess() {
    if (!selectedManagedUser || !canManageUsers) {
      setError("Seu usuario nao possui permissao para gerenciar acessos.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await fetchJson<{ ok: true }>("/api/access", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedManagedUser.id,
          roleId: Number(userAccessForm.roleId),
          active: userAccessForm.active,
          firstAccessPending: userAccessForm.firstAccessPending,
          overrides: userAccessForm.firstAccessPending
            ? []
            : userAccessForm.overrides
                .filter((override) => override.mode !== "inherit")
                .map((override) => ({
                code: override.code,
                allowed: override.mode === "allow",
              })),
        }),
      });

      setUserAccessModalOpen(false);
      setSelectedManagedUser(null);
      setUserAccessForm(emptyUserAccessForm());
      await refreshInventory();
      setNotice("Acesso do usuario atualizado com sucesso.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao atualizar acesso do usuario";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function openRoleAccessModal(role: AccessRole) {
    setSelectedRole(role);
    setRoleAccessForm({
      id: role.id,
      permissionCodes: role.permissions ?? [],
    });
    setRoleAccessModalOpen(true);
  }

  async function handleSaveRoleAccess() {
    if (!selectedRole || !canManageUsers) {
      setError("Seu usuario nao possui permissao para gerenciar grupos.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await fetchJson<{ ok: true }>("/api/access", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissionCodes: roleAccessForm.permissionCodes,
        }),
      });

      setRoleAccessModalOpen(false);
      setSelectedRole(null);
      setRoleAccessForm(emptyRoleAccessForm());
      await refreshInventory();
      setNotice("Permissoes do grupo atualizadas com sucesso.");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro ao atualizar permissoes do grupo";
      setError(message);
    } finally {
      setBusy(false);
    }
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
          {canViewItems && (
            <div className={`nav-item ${view === "produtos" ? "active" : ""}`} onClick={() => setView("produtos")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="10" rx="1" />
                <path d="M2 7h12" />
              </svg>
              Produtos
            </div>
          )}
          {canViewItems && (
            <div className={`nav-item ${view === "estoque" ? "active" : ""}`} onClick={() => setView("estoque")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1 14 4.5v7L8 15 2 11.5v-7L8 1Z" />
                <path d="M8 8v7M8 8l6-3.5M8 8 2 4.5" />
              </svg>
              Estoque
              <span className="nav-badge">{dashboardMetrics.critical}</span>
            </div>
          )}

          <div className="nav-section">Operacoes</div>
          {canMoveStock && (
            <div className={`nav-item ${view === "movimentacao" ? "active" : ""}`} onClick={() => setView("movimentacao")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10" />
                <path d="m9 4 4 4-4 4" />
              </svg>
              Movimentacao
            </div>
          )}
          {canViewAudit && (
            <div className={`nav-item ${view === "auditoria" ? "active" : ""}`} onClick={() => setView("auditoria")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4.5" />
                <path d="m10 10 4 4" />
              </svg>
              Auditoria
            </div>
          )}
          {(canViewItems || canManageSectors || canMoveStock) && (
            <div className={`nav-item ${view === "setores" ? "active" : ""}`} onClick={() => setView("setores")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 13h12" />
                <path d="M4 13V7m4 6V3m4 10V9" />
              </svg>
              Setores
            </div>
          )}
          {(canViewItems || canManageCategories) && (
            <div className={`nav-item ${view === "categorias" ? "active" : ""}`} onClick={() => setView("categorias")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="10" rx="1" />
                <path d="M5 6h6M5 9h6" />
              </svg>
              Categorias
            </div>
          )}

          <div className="nav-section">Acesso</div>
          {(canManageUsers || currentUser?.firstAccessPending) && (
            <div className={`nav-item ${view === "permissoes" ? "active" : ""}`} onClick={() => setView("permissoes")}>
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1 3 3v4c0 3.2 2 6 5 8 3-2 5-4.8 5-8V3L8 1Z" />
                <path d="M6.5 8 8 9.5 10.5 6.5" />
              </svg>
              Seguranca
            </div>
          )}
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
                disabled={!canViewItems}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    clearSearch();
                    event.currentTarget.blur();
                  }
                }}
              />
              {search.trim() && (
                <button className="search-clear" onClick={clearSearch} title="Limpar busca" type="button">
                  x
                </button>
              )}
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
          {notice && (
            <div className="status-banner status-warning">
              <span>{notice}</span>
              <button className="status-close" onClick={() => setNotice(null)} type="button">
                x
              </button>
            </div>
          )}
          {!loading && !error && (
            <>
              {view === "dashboard" && (
                <div className="view active">
                  {currentUser?.firstAccessPending && (
                    <div className="status-banner status-warning">
                      <span>
                        Seu primeiro acesso esta pendente. Por enquanto voce visualiza apenas o dashboard principal ate um administrador liberar seu perfil.
                      </span>
                    </div>
                  )}
                  <div className="card compact-card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                      <span className="card-title">Filtros gerenciais</span>
                      <span className="card-action" onClick={() => setDashboardFilters(emptyDashboardFilters())}>
                        Limpar filtros
                      </span>
                    </div>
                    <div className="form-grid">
                      <div className="form-row">
                        <div>
                          <label>Periodo de</label>
                          <input
                            type="date"
                            value={dashboardFilters.dateFrom}
                            onChange={(event) =>
                              setDashboardFilters((current) => ({ ...current, dateFrom: event.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label>Ate</label>
                          <input
                            type="date"
                            value={dashboardFilters.dateTo}
                            onChange={(event) =>
                              setDashboardFilters((current) => ({ ...current, dateTo: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div>
                          <label>Setor</label>
                          <select
                            value={dashboardFilters.sectorId}
                            onChange={(event) =>
                              setDashboardFilters((current) => ({ ...current, sectorId: event.target.value }))
                            }
                          >
                            <option value="">Todos</option>
                            {sectors.map((sector) => (
                              <option value={sector.id} key={sector.id}>
                                {sector.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label>Categoria</label>
                          <select
                            value={dashboardFilters.categoryId}
                            onChange={(event) =>
                              setDashboardFilters((current) => ({ ...current, categoryId: event.target.value }))
                            }
                          >
                            <option value="">Todas</option>
                            {itemCategories.map((category) => (
                              <option value={category.id} key={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
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
                        <span className="card-action">{categoryStats.length} categorias</span>
                      </div>
                      <div className="legend">
                        {categoryStats.length === 0 && <div className="empty-state">Nenhum item cadastrado ainda.</div>}
                        {categoryStats.slice(0, 5).map((category) => (
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
                        <span className="card-title">Equipamentos enviados por setor</span>
                        <span className="card-action">saidas e transferencias</span>
                      </div>
                      <div className="form-grid compact-form">
                        <div>
                          <label>Setor / secretaria</label>
                          <select value={selectedSectorId} onChange={(event) => setSelectedSectorId(event.target.value)}>
                            {sectors.map((sector) => (
                              <option value={sector.id} key={sector.id}>
                                {sector.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selectedSectorStats ? (
                        <div className="sector-kpis">
                          <div className="sector-kpi">
                            <div className="metric-label">Quantidade enviada</div>
                            <div className="metric-value">{selectedSectorStats.totalQuantity}</div>
                          </div>
                          <div className="sector-kpi">
                            <div className="metric-label">Movimentacoes</div>
                            <div className="metric-value">{selectedSectorStats.movementCount}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-state">Cadastre setores para acompanhar as entregas por secretaria.</div>
                      )}
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Resumo por setor</span>
                        {canManageSectors && (
                          <span className="card-action" onClick={() => setView("setores")}>
                            Gerenciar setores
                          </span>
                        )}
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Setor</th>
                              <th>Qtd enviada</th>
                              <th>Movimentacoes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sectorMovements.map((item) => (
                              <tr key={item.sectorId}>
                                <td>{item.sectorName}</td>
                                <td>{item.totalQuantity}</td>
                                <td>{item.movementCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                                {movement.sectorName ? ` - ${movement.sectorName}` : ""}
                                {movement.glpiTicketNumber ? ` - GLPI ${movement.glpiTicketNumber}` : ""}
                              </div>
                            </div>
                            <div className="audit-time">{formatDateTime(movement.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Itens mais movimentados</span>
                        <span className="card-action">ranking operacional</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Categoria</th>
                              <th>Qtd</th>
                              <th>Mov.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topMovedItems.length === 0 && (
                              <tr>
                                <td colSpan={4}>Nenhuma saida encontrada com os filtros atuais.</td>
                              </tr>
                            )}
                            {topMovedItems.map((item) => (
                              <tr key={item.itemId}>
                                <td>
                                  <b>{item.itemName}</b>
                                  <div className="table-subtext">{item.assetTag || "Sem patrimonio"}</div>
                                </td>
                                <td>{item.category}</td>
                                <td>{item.totalQuantity}</td>
                                <td>{item.movementCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Itens sem saida recente</span>
                        <span className="card-action">estoque parado</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Saldo</th>
                              <th>Ultima saida</th>
                              <th>Dias</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staleItems.length === 0 && (
                              <tr>
                                <td colSpan={4}>Nenhum item disponivel para analise.</td>
                              </tr>
                            )}
                            {staleItems.map((item) => (
                              <tr key={item.itemId}>
                                <td>
                                  <b>{item.itemName}</b>
                                  <div className="table-subtext">{item.assetTag || "Sem patrimonio"}</div>
                                </td>
                                <td>{item.qtyTotal}</td>
                                <td>{item.lastOutAt ? formatDate(item.lastOutAt) : "Sem saida"}</td>
                                <td>{item.daysWithoutOut ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Historico patrimonial por setor</span>
                      <span className="card-action">itens com patrimonio movimentados</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Patrimonio</th>
                            <th>Item</th>
                            <th>Setor</th>
                            <th>Tipo</th>
                            <th>Qtd</th>
                            <th>Ultima mov.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assetHistory.length === 0 && (
                            <tr>
                              <td colSpan={6}>Nenhum historico patrimonial encontrado com os filtros atuais.</td>
                            </tr>
                          )}
                          {assetHistory.map((history) => (
                            <tr key={`${history.itemId}-${history.sectorName}-${history.movementType}`}>
                              <td>{history.assetTag}</td>
                              <td>{history.itemName}</td>
                              <td>{history.sectorName}</td>
                              <td>{getMovementTypeLabel(history.movementType)}</td>
                              <td>{history.totalQuantity}</td>
                              <td>{formatDateTime(history.lastMovementAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {view === "produtos" && (
                <div className="view active">
                  <div className="prod-grid">
                    {paginatedProducts.map((item) => (
                      <div className="prod-card" key={item.id}>
                        <div className="prod-media">
                          <div className="prod-img">
                            {item.imagePath ? <img src={item.imagePath} alt={item.name} /> : <span className="prod-placeholder">IMG</span>}
                          </div>
                          <div className="prod-side-actions">
                            {(canUpdateItem || canDeleteItem) && (
                              <>
                                {canUpdateItem && (
                                <button className="icon-btn" onClick={() => openEditModal(item)} title="Editar item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
                                    <path d="m13.5 6.5 3 3" />
                                  </svg>
                                </button>
                                )}
                                {canDeleteItem && (
                                <button
                                  className="icon-btn danger-icon-btn"
                                  onClick={() => openDeleteProductModal(item)}
                                  title="Excluir item"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 7h16" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M6 7l1 12h10l1-12" />
                                    <path d="M9 7V4h6v3" />
                                  </svg>
                                </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="prod-body">
                          <div className="prod-name">{item.name}</div>
                          <div className="prod-cat">{item.category}</div>
                          <div className="prod-meta">{item.assetTag ? `Patrimonio: ${item.assetTag}` : "Sem patrimonio informado"}</div>
                          <div className="prod-meta">{item.serialNumber ? `Serie: ${item.serialNumber}` : "Serie nao informada"}</div>
                          <div className="prod-meta">{item.sku ? `SKU: ${item.sku}` : "SKU nao informado"}</div>
                          <div className="prod-meta">{item.locationName ? `Local: ${item.locationName}` : "Local nao informado"}</div>
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
                  <div className="pager">
                    <button className="btn" disabled={productPage <= 1} onClick={() => setProductPage((page) => page - 1)}>
                      Anterior
                    </button>
                    <span className="pager-info">
                      Pagina {productPage} de {totalProductPages}
                    </span>
                    <button
                      className="btn"
                      disabled={productPage >= totalProductPages}
                      onClick={() => setProductPage((page) => page + 1)}
                    >
                      Proxima
                    </button>
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

                        <div>
                          <label>Setor</label>
                          <select
                            value={movementForm.sectorId}
                            onChange={(event) =>
                              setMovementForm((current) => ({ ...current, sectorId: event.target.value }))
                            }
                          >
                            <option value="">Nao informar setor</option>
                            {sectors.map((sector) => (
                              <option value={sector.id} key={sector.id}>
                                {sector.name}
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
                              placeholder={movementForm.movementType === "out" ? "Obrigatorio para saida" : "Opcional para comentar no chamado"}
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
                              <div className="audit-meta">
                                {movement.requestedByName}
                                {movement.sectorName ? ` - ${movement.sectorName}` : ""}
                                {movement.glpiTicketNumber ? ` - GLPI ${movement.glpiTicketNumber}` : ""}
                                {movement.glpiCommentStatus ? ` - ${movement.glpiCommentStatus}` : ""}
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

              {view === "auditoria" && (
                <div className="view active">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Trilha de auditoria</span>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Entidade</th>
                            <th>Acao</th>
                            <th>Usuario</th>
                            <th>IP</th>
                            <th>Rota</th>
                            <th>Antes</th>
                            <th>Depois</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td>{formatDateTime(log.createdAt)}</td>
                              <td>{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</td>
                              <td>{log.action}</td>
                              <td>{log.actorUsername || log.actorUserId || "-"}</td>
                              <td>{log.ipAddress || "-"}</td>
                              <td>{log.routePath || "-"}</td>
                              <td>{log.beforeData ? "Sim" : "-"}</td>
                              <td>{log.afterData ? "Sim" : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {view === "setores" && (
                <div className="view active">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Cadastro de setores e secretarias</span>
                      {canManageSectors && (
                        <button className="btn btn-primary" onClick={openCreateSectorModal}>
                          + Novo setor
                        </button>
                      )}
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Descricao</th>
                            <th>Qtd enviada</th>
                            <th>Movimentacoes</th>
                            <th>Acao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sectors.map((sector) => {
                            const stats = sectorMovements.find((item) => item.sectorId === sector.id);

                            return (
                              <tr key={sector.id}>
                                <td>{sector.name}</td>
                                <td>{sector.description || "-"}</td>
                                <td>{stats?.totalQuantity ?? 0}</td>
                                <td>{stats?.movementCount ?? 0}</td>
                                <td>
                                  <div className="table-actions">
                                    {canManageSectors ? (
                                      <>
                                        <span className="card-action" onClick={() => openEditSectorModal(sector)}>
                                          Editar
                                        </span>
                                        <span className="card-action danger-action" onClick={() => handleDeleteSector(sector.id)}>
                                          Excluir
                                        </span>
                                      </>
                                    ) : (
                                      <span className="table-subtext">Somente leitura</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {view === "categorias" && (
                <div className="view active">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Cadastro de categorias</span>
                      {canManageCategories && (
                        <button className="btn btn-primary" onClick={openCreateCategoryModal}>
                          + Nova categoria
                        </button>
                      )}
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Descricao</th>
                            <th>Produtos</th>
                            <th>Acao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemCategories.map((category) => {
                            const linkedCount = products.filter((item) => item.categoryId === category.id).length;

                            return (
                              <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{category.description || "-"}</td>
                                <td>{linkedCount}</td>
                                <td>
                                  <div className="table-actions">
                                    {canManageCategories ? (
                                      <>
                                        <span className="card-action" onClick={() => openEditCategoryModal(category)}>
                                          Editar
                                        </span>
                                        <span className="card-action danger-action" onClick={() => handleDeleteCategory(category.id)}>
                                          Excluir
                                        </span>
                                      </>
                                    ) : (
                                      <span className="table-subtext">Somente leitura</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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
                        {currentUser?.firstAccessPending && (
                          <div className="security-item">
                            <div className="security-title">Primeiro acesso pendente</div>
                            <div className="security-sub">Seu usuario esta limitado ao dashboard ate um admin liberar o restante.</div>
                          </div>
                        )}
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

                  {canManageUsers && (
                    <div className="card" style={{ marginTop: 16 }}>
                      <div className="card-header">
                        <span className="card-title">Grupos de acesso</span>
                        <span className="card-action">Permissoes base por perfil</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Grupo</th>
                              <th>Descricao</th>
                              <th>Permissoes</th>
                              <th>Acao</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accessRoles.map((role) => (
                              <tr key={role.id}>
                                <td>{role.name}</td>
                                <td>{role.description || "-"}</td>
                                <td>{role.permissions?.length ?? 0}</td>
                                <td>
                                  <span className="card-action" onClick={() => openRoleAccessModal(role)}>
                                    Configurar grupo
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {canManageUsers && (
                    <div className="card" style={{ marginTop: 16 }}>
                      <div className="card-header">
                        <span className="card-title">Usuarios, grupos e permissoes</span>
                        <span className="card-action">Primeiro acesso inicia apenas com dashboard</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Usuario</th>
                              <th>Grupo</th>
                              <th>Status</th>
                              <th>Primeiro acesso</th>
                              <th>Permissoes efetivas</th>
                              <th>Acao</th>
                            </tr>
                          </thead>
                          <tbody>
                            {managedUsers.map((user) => (
                              <tr key={user.id}>
                                <td>
                                  <b>{user.displayName}</b>
                                  <div className="table-subtext">{user.username}</div>
                                </td>
                                <td>{user.roleName || "-"}</td>
                                <td>
                                  <span className={`tag ${user.active ? "tag-green" : "tag-red"}`}>
                                    {user.active ? "Ativo" : "Inativo"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`tag ${user.firstAccessPending ? "tag-amber" : "tag-blue"}`}>
                                    {user.firstAccessPending ? "Pendente" : "Liberado"}
                                  </span>
                                </td>
                                <td>{user.effectivePermissions.length}</td>
                                <td>
                                  <span className="card-action" onClick={() => openUserAccessModal(user)}>
                                    Configurar
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                  <select
                    value={newProduct.categoryId}
                    onChange={(event) =>
                      setNewProduct((current) => ({ ...current, categoryId: event.target.value }))
                    }
                  >
                    <option value="">Selecione a categoria</option>
                    {itemCategories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {itemCategories.length === 0 && (
                    <div className="inline-hint">
                      Nenhuma categoria cadastrada.{" "}
                      <span
                        className="card-action"
                        onClick={() => {
                          setProductModalOpen(false);
                          setView("categorias");
                          openCreateCategoryModal();
                        }}
                      >
                        Criar categoria
                      </span>
                    </div>
                  )}
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
                  <label>Numero de serie</label>
                  <input
                    value={newProduct.serialNumber}
                    onChange={(event) => setNewProduct((current) => ({ ...current, serialNumber: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Status do item</label>
                  <select
                    value={newProduct.itemStatus}
                    onChange={(event) => setNewProduct((current) => ({ ...current, itemStatus: event.target.value }))}
                  >
                    <option value="em_estoque">Em estoque</option>
                    <option value="em_uso">Em uso</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="baixado">Baixado</option>
                  </select>
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
                  <label>Responsavel</label>
                  <input
                    value={newProduct.responsibleName}
                    onChange={(event) => setNewProduct((current) => ({ ...current, responsibleName: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Localizacao</label>
                  <input
                    value={newProduct.locationName}
                    onChange={(event) => setNewProduct((current) => ({ ...current, locationName: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Fornecedor</label>
                  <input
                    value={newProduct.supplierName}
                    onChange={(event) => setNewProduct((current) => ({ ...current, supplierName: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Nota fiscal</label>
                  <input
                    value={newProduct.invoiceNumber}
                    onChange={(event) => setNewProduct((current) => ({ ...current, invoiceNumber: event.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div>
                    <label>Data da compra</label>
                    <input
                      type="date"
                      value={newProduct.purchaseDate}
                      onChange={(event) => setNewProduct((current) => ({ ...current, purchaseDate: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label>Valor</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProduct.purchaseValue}
                      onChange={(event) => setNewProduct((current) => ({ ...current, purchaseValue: event.target.value }))}
                    />
                  </div>
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
          <div className="modal-card modal-edit">
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
                  <select
                    value={selectedProduct.categoryId ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current
                          ? {
                              ...current,
                              categoryId: event.target.value ? Number(event.target.value) : null,
                              category:
                                itemCategories.find((category) => category.id === Number(event.target.value))?.name ??
                                current.category,
                            }
                          : current,
                      )
                    }
                  >
                    <option value="">Selecione a categoria</option>
                    {itemCategories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {itemCategories.length === 0 && (
                    <div className="inline-hint">Nenhuma categoria cadastrada no momento.</div>
                  )}
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
                  <label>Numero de serie</label>
                  <input
                    value={selectedProduct.serialNumber ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, serialNumber: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Status do item</label>
                  <select
                    value={selectedProduct.itemStatus ?? "em_estoque"}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, itemStatus: event.target.value } : current,
                      )
                    }
                  >
                    <option value="em_estoque">Em estoque</option>
                    <option value="em_uso">Em uso</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="baixado">Baixado</option>
                  </select>
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
                  <label>Responsavel</label>
                  <input
                    value={selectedProduct.responsibleName ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, responsibleName: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Localizacao</label>
                  <input
                    value={selectedProduct.locationName ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, locationName: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Fornecedor</label>
                  <input
                    value={selectedProduct.supplierName ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, supplierName: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div>
                  <label>Nota fiscal</label>
                  <input
                    value={selectedProduct.invoiceNumber ?? ""}
                    onChange={(event) =>
                      setSelectedProduct((current) =>
                        current ? { ...current, invoiceNumber: event.target.value } : current,
                      )
                    }
                  />
                </div>
                <div className="form-row">
                  <div>
                    <label>Data da compra</label>
                    <input
                      type="date"
                      value={selectedProduct.purchaseDate ?? ""}
                      onChange={(event) =>
                        setSelectedProduct((current) =>
                          current ? { ...current, purchaseDate: event.target.value } : current,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label>Valor</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedProduct.purchaseValue ?? ""}
                      onChange={(event) =>
                        setSelectedProduct((current) =>
                          current ? { ...current, purchaseValue: Number(event.target.value) } : current,
                        )
                      }
                    />
                  </div>
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

      {productPendingDelete && (
        <div className="modal">
          <div className="modal-card modal-alert">
            <div className="modal-header">
              <div className="modal-title">Confirmar exclusao do produto</div>
              <button className="modal-close" onClick={() => setProductPendingDelete(null)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="alert-copy">
                O produto <b>{productPendingDelete.name}</b> sera inativado no sistema.
              </div>
              <div className="alert-copy delete-warning-text">
                O historico de movimentacoes e vinculos patrimoniais sera preservado para auditoria, mas o item
                sairá das listagens operacionais. Essa acao deve ser tratada como irreversivel no fluxo normal.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setProductPendingDelete(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteProduct} disabled={busy}>
                {busy ? "Inativando..." : "Sim, inativar produto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sectorModalOpen && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">{sectorForm.id ? "Editar setor" : "Novo setor"}</div>
              <button className="modal-close" onClick={() => setSectorModalOpen(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div>
                  <label>Nome do setor</label>
                  <input
                    value={sectorForm.name}
                    onChange={(event) => setSectorForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Descricao</label>
                  <textarea
                    rows={3}
                    value={sectorForm.description}
                    onChange={(event) =>
                      setSectorForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setSectorModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveSector} disabled={busy}>
                {busy ? "Salvando..." : "Salvar setor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">{categoryForm.id ? "Editar categoria" : "Nova categoria"}</div>
              <button className="modal-close" onClick={() => setCategoryModalOpen(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div>
                  <label>Nome da categoria</label>
                  <input
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Descricao</label>
                  <textarea
                    rows={3}
                    value={categoryForm.description}
                    onChange={(event) =>
                      setCategoryForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setCategoryModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveCategory} disabled={busy}>
                {busy ? "Salvando..." : "Salvar categoria"}
              </button>
            </div>
          </div>
        </div>
      )}

      {userAccessModalOpen && selectedManagedUser && (
        <div className="modal">
          <div className="modal-card modal-wide">
            <div className="modal-header">
              <div className="modal-title">Acesso do usuario {selectedManagedUser.displayName}</div>
              <button className="modal-close" onClick={() => setUserAccessModalOpen(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-row">
                  <div>
                    <label>Grupo</label>
                    <select
                      value={userAccessForm.roleId}
                      onChange={(event) =>
                        setUserAccessForm((current) => ({ ...current, roleId: event.target.value }))
                      }
                    >
                      <option value="">Selecione o grupo</option>
                      {accessRoles.map((role) => (
                        <option value={role.id} key={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={userAccessForm.active ? "active" : "inactive"}
                      onChange={(event) =>
                        setUserAccessForm((current) => ({
                          ...current,
                          active: event.target.value === "active",
                        }))
                      }
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="security-item">
                  <div className="perm-row">
                    <span className="perm-label">Primeiro acesso pendente</span>
                    <div
                      className={`toggle ${userAccessForm.firstAccessPending ? "on" : ""}`}
                      onClick={() =>
                        setUserAccessForm((current) => ({
                          ...current,
                          firstAccessPending: !current.firstAccessPending,
                        }))
                      }
                    />
                  </div>
                  <div className="security-sub">
                    Enquanto estiver pendente, o usuario so acessa o dashboard.
                  </div>
                </div>

                {!userAccessForm.firstAccessPending && (
                  <div className="permission-grid">
                    {accessPermissions.map((permission) => {
                      const override = userAccessForm.overrides.find((item) => item.code === permission.code);
                      const mode = override?.mode ?? "inherit";

                      return (
                        <div className="perm-row permission-editor-row" key={permission.code}>
                          <div>
                            <div className="perm-label">{permission.code}</div>
                            <div className="table-subtext">{permission.description || "Sem descricao"}</div>
                          </div>
                          <div className="override-actions">
                            <button
                              type="button"
                              className={`state-chip ${mode === "inherit" ? "active" : ""}`}
                              onClick={() =>
                                setUserAccessForm((current) => ({
                                  ...current,
                                  overrides: current.overrides.map((item) =>
                                    item.code === permission.code
                                      ? { ...item, mode: "inherit" }
                                      : item,
                                  ),
                                }))
                              }
                            >
                              Grupo
                            </button>
                            <button
                              type="button"
                              className={`state-chip success ${mode === "allow" ? "active" : ""}`}
                              onClick={() =>
                                setUserAccessForm((current) => ({
                                  ...current,
                                  overrides: current.overrides.map((item) =>
                                    item.code === permission.code
                                      ? { ...item, mode: "allow" }
                                      : item,
                                  ),
                                }))
                              }
                            >
                              Permitir
                            </button>
                            <button
                              type="button"
                              className={`state-chip danger ${mode === "deny" ? "active" : ""}`}
                              onClick={() =>
                                setUserAccessForm((current) => ({
                                  ...current,
                                  overrides: current.overrides.map((item) =>
                                    item.code === permission.code
                                      ? { ...item, mode: "deny" }
                                      : item,
                                  ),
                                }))
                              }
                            >
                              Negar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setUserAccessModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveUserAccess} disabled={busy}>
                {busy ? "Salvando..." : "Salvar acesso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {roleAccessModalOpen && selectedRole && (
        <div className="modal">
          <div className="modal-card modal-wide">
            <div className="modal-header">
              <div className="modal-title">Permissoes do grupo {selectedRole.name}</div>
              <button className="modal-close" onClick={() => setRoleAccessModalOpen(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="permission-grid">
                {accessPermissions.map((permission) => {
                  const enabled = roleAccessForm.permissionCodes.includes(permission.code);
                  const isLocked = permission.code === "view_dashboard";

                  return (
                    <div className="perm-row permission-editor-row" key={permission.code}>
                      <div>
                        <div className="perm-label">{permission.code}</div>
                        <div className="table-subtext">{permission.description || "Sem descricao"}</div>
                      </div>
                      <div
                        className={`toggle ${enabled ? "on" : ""} ${isLocked ? "disabled-toggle" : ""}`}
                        onClick={() =>
                          !isLocked &&
                          setRoleAccessForm((current) => ({
                            ...current,
                            permissionCodes: enabled
                              ? current.permissionCodes.filter((code) => code !== permission.code)
                              : [...current.permissionCodes, permission.code],
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setRoleAccessModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveRoleAccess} disabled={busy}>
                {busy ? "Salvando..." : "Salvar grupo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {glpiWarningTicketId && (
        <div className="modal">
          <div className="modal-card modal-alert">
            <div className="modal-header">
              <div className="modal-title">Aviso de integracao GLPI</div>
              <button className="modal-close" onClick={() => setGlpiWarningTicketId(null)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="alert-copy">
                Foi realizada a movimentacao, porem houve um erro na postagem da API do GLPI, por
                gentileza verificar manualmente no chamado {glpiWarningTicketId} e fazer a movimentacao por la.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setGlpiWarningTicketId(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
