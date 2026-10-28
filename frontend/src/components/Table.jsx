import React from 'react';
import { Spinner } from './Spinner.jsx';
import { EmptyState } from './EmptyState.jsx';

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  className = ''
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Spinner size="md" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No Data" description={emptyMessage} />;
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-5 py-3.5 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || rowIdx}
              className="hover:bg-slate-50/80 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`px-5 py-3.5 whitespace-nowrap ${col.className || ''}`}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
