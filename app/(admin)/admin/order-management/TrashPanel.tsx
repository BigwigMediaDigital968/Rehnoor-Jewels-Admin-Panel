// Add this component to OrderManagement.tsx, near your other modal
// components (StatusModal, ShippingModal, etc). It's self-contained: it
// fetches its own list, and handles restore + permanent-delete internally
// so it doesn't need any changes to the parent Modal union beyond
// "trash-view" itself.

function TrashPanel({
  onClose,
  onOrderRestored,
}: {
  onClose: () => void;
  onOrderRestored?: () => void; // call this to refresh the main active-orders table
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmPermanent, setConfirmPermanent] = useState<{ id: string; orderNumber: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrashedOrders(page, 15);
      setOrders(data.data || []);
      setPagination(data.pagination || null);
    } catch (e: unknown) {
      setBanner({ type: "error", message: e instanceof Error ? e.message : "Failed to load trash" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const daysLeft = (trashedAt?: string | null) => {
    if (!trashedAt) return 30;
    const elapsedDays = (Date.now() - new Date(trashedAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(30 - elapsedDays));
  };

  const handleRestore = async (order: Order) => {
    setBusyId(order._id);
    try {
      await restoreOrder(order._id);
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      setBanner({ type: "success", message: `${order.orderNumber} restored to active orders.` });
      onOrderRestored?.();
    } catch (e: unknown) {
      setBanner({ type: "error", message: e instanceof Error ? e.message : "Restore failed" });
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmPermanent) return;
    const { id, orderNumber } = confirmPermanent;
    setConfirmPermanent(null);
    setBusyId(id);
    try {
      await permanentlyDeleteOrder(id);
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setBanner({ type: "success", message: `${orderNumber} permanently deleted.` });
    } catch (e: unknown) {
      setBanner({ type: "error", message: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <ModalOverlay onClose={onClose} zIndex={1250}>
        <div
          style={{
            width: "100%",
            maxWidth: 880,
            background: "#fff",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
            margin: "auto",
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ height: 3, background: "linear-gradient(90deg,#e74c3c,#f0a500)" }} />
          <ModalHeader
            title="Trash"
            subtitle="Deleted orders — auto-purged after 30 days"
            onClose={onClose}
          />

          {banner && (
            <div
              style={{
                margin: "12px 24px 0",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12,
                background: banner.type === "success" ? "#EDFAF3" : "#FFF0F0",
                border: `1px solid ${banner.type === "success" ? "#2ecc7130" : "#FFCDD2"}`,
                color: banner.type === "success" ? "#1a7a4a" : "#c0392b",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{banner.message}</span>
              <button
                onClick={() => setBanner(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <Spinner />
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#bbb" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🗑</div>
                Trash is empty
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {orders.map((order) => {
                  const left = daysLeft(order.trashedAt);
                  const isBusy = busyId === order._id;
                  return (
                    <div
                      key={order._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 14px",
                        background: "#FAFAF8",
                        border: "1px solid #EEEAE0",
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#003720", fontFamily: "monospace" }}>
                            {order.orderNumber}
                          </span>
                          <StatusBadge status={order.status} />
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: left <= 3 ? "#c0392b" : "#a06800",
                              background: left <= 3 ? "#FFF0F0" : "#FFF8E6",
                              border: `1px solid ${left <= 3 ? "#FFCDD2" : "#f0a50030"}`,
                              padding: "2px 8px",
                              borderRadius: 10,
                            }}
                          >
                            {left} day{left !== 1 ? "s" : ""} left
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>
                          {order.customerName} · {inr(order.pricing.total)}
                        </p>
                        <p style={{ fontSize: 10, color: "#aaa", margin: "2px 0 0" }}>
                          Trashed {order.trashedAt ? fmtFull(order.trashedAt) : "—"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => handleRestore(order)}
                          disabled={isBusy}
                          style={{
                            ...actionBtn,
                            padding: "7px 14px",
                            background: "#F0FFF4",
                            color: "#166534",
                            border: "1px solid #D1FAE5",
                            cursor: isBusy ? "wait" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          ↺ Restore
                        </button>
                        <button
                          onClick={() => setConfirmPermanent({ id: order._id, orderNumber: order.orderNumber })}
                          disabled={isBusy}
                          style={{
                            ...actionBtn,
                            padding: "7px 14px",
                            background: "#FFF5F5",
                            color: "#c0392b",
                            border: "1px solid #FFCDD2",
                            cursor: isBusy ? "wait" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                          }}
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "12px 24px",
                borderTop: "1px solid #F0EBE0",
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...btnOutline, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
              >
                ← Prev
              </button>
              <span style={{ color: "#888", fontSize: 12 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                style={{
                  ...btnOutline,
                  opacity: page === pagination.totalPages ? 0.5 : 1,
                  cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </ModalOverlay>

      {confirmPermanent && (
        <ModalOverlay onClose={() => setConfirmPermanent(null)} zIndex={1450}>
          <ModalCard maxWidth={400} accentColor="#e74c3c">
            <div style={{ padding: "28px 24px", textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#FFF0F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 20,
                  color: "#c0392b",
                }}
              >
                ⚠
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
                Permanently delete {confirmPermanent.orderNumber}?
              </h3>
              <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6, margin: 0 }}>
                This cannot be undone. The order and all its data will be removed forever.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
                <button onClick={() => setConfirmPermanent(null)} style={btnOutline}>
                  Cancel
                </button>
                <button onClick={handlePermanentDelete} style={{ ...btnDanger, cursor: "pointer" }}>
                  Delete Forever
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}