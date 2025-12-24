// apps/admin/components/Table.tsx
export function Table(props: { columns: string[]; data: any[] }) {
  return (
    <div className="overflow-auto border border-white/10 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            {props.columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.data.map((row, i) => (
            <tr key={i} className="border-t border-white/10">
              {props.columns.map((c) => (
                <td key={c} className="px-3 py-2">
                  {String(row?.[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
