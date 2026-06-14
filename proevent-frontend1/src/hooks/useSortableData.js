// ============================================================
// HOOK CUSTOM: useSortableData
// Pertenece a: Utilidades Genéricas
// Propósito: Hook de React que recibe un array de objetos y 
// permite ordenarlos dinámicamente por la clave (propiedad)
// especificada, soportando strings insensibles a mayúsculas 
// y números parseados.
// ============================================================

import { useState, useMemo } from 'react';

export const useSortableData = (items, config = null) => {
  // --- ESTADOS ---
  const [sortConfig, setSortConfig] = useState(config);

  // --- MEMOIZACIÓN: sortedItems ---
  // Recalcula la lista ordenada solo cuando cambian los items o la configuración
  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejo de valores nulos o indefinidos
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Si son strings, comparamos sin importar mayúsculas
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Intentar parsear a número si parece un número de ID (e.g. "123")
          const aNum = parseFloat(aValue);
          const bNum = parseFloat(bValue);
          if (!isNaN(aNum) && !isNaN(bNum) && String(aNum) === aValue && String(bNum) === bValue) {
            aValue = aNum;
            bValue = bNum;
          } else {
             aValue = aValue.toLowerCase();
             bValue = bValue.toLowerCase();
          }
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  // --- FUNCIÓN: requestSort ---
  // Cambia la clave de ordenamiento o invierte la dirección si ya estaba activa
  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
