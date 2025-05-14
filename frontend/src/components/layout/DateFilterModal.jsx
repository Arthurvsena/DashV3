import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DateFilterModal.css';

export default function DateFilterModal({ isOpen, onClose, onApply }) {
  const [range, setRange] = useState([null, null]);
  const [startDate, endDate] = range;

  const handleConfirm = () => {
    if (startDate && endDate) {
      onApply({ start: startDate, end: endDate });
      onClose();
    }
  };

  const calcularDuracao = useMemo(() => {
    if (!startDate || !endDate) return '';

    const diffMs = Math.abs(endDate - startDate);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'semana' : 'semanas'}`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }

    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    const months = Math.floor(remainingDays / 30);

    if (months > 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }

    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }, [startDate, endDate]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-largura-custom">
        <h2>Selecionar Período</h2>

        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => setRange(update)}
          dateFormat="dd/MM/yyyy"
          isClearable
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          inline
          calendarClassName="dark-calendar"
        />

        {/* Exibir duração filtrada */}
        {startDate && endDate && (
          <p className="duracao-filtrada">⏱️ {calcularDuracao}</p>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-confirm" onClick={handleConfirm}>Aplicar Filtro</button>
        </div>
      </div>
    </div>
  );
}
