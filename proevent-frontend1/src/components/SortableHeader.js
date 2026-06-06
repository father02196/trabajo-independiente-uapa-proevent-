import React from 'react';

const SortableHeader = ({ label, sortKey, sortConfig, requestSort, style }) => {
  const isActive = sortConfig && sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <th 
      className={`sortable-header ${isActive ? 'active-sort' : ''}`} 
      onClick={() => requestSort(sortKey)}
      style={style}
    >
      {label}
      {isActive ? (
        <span className="sort-icon">{direction === 'ascending' ? '▲' : '▼'}</span>
      ) : (
        <span className="sort-icon">▲▼</span>
      )}
    </th>
  );
};

export default SortableHeader;
