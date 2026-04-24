export default function Topbar({ supertitle, title, actions }) {
  return (
    <div style={{
      height: 64, background: "#FFFFFF",
      borderBottom: "1px solid rgba(10,15,30,0.06)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", position: "sticky", top: 0, zIndex: 10,
      flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 2 }}>
          {supertitle}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.3 }}>
          {title}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {actions}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.6)", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "#556070", fontWeight: 600 }}>En línea</span>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg,#00C2CB,#0099FF)",
          color: "#0A0F1E", fontWeight: 800, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>AM</div>
      </div>
    </div>
  );
}
