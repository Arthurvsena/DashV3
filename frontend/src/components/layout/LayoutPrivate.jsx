// src/layout/LayoutPrivate.jsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import DateFilterModal from "./DateFilterModal";


export default function LayoutPrivate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const hoje = new Date();
  const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [startDate, setStartDate] = useState(primeiroDiaDoMes);
  const [endDate, setEndDate] = useState(hoje);

  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isProdutos = location.pathname.startsWith("/produtos");

  const handleApplyDateFilter = ({ start, end }) => {
    console.log("🔥 DEBUG: Data escolhida no calendário:", { start, end }); // 🐞
    setStartDate(start);
    setEndDate(end);
    setFilterOpen(false);
  };

  return (
    <div>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="ml-0 md:ml-[250px]">
        <Topbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showDateFilter={isDashboard || isProdutos}
          onOpenFilter={() => setFilterOpen(true)}
        />

      <main className="p-4">
      <Outlet context={{ startDate, endDate }} />

      </main>
      </div>

      <DateFilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyDateFilter}
      />
    </div>
  );
}
