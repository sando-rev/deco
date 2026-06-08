/**
 * Styled data table with zebra rows and horizontal scroll.
 *
 * Usage:
 *   import DataTable from "@/components/admin/DataTable";
 *
 *   const columns = [
 *     { key: "name",   label: "Name" },
 *     { key: "email",  label: "Email" },
 *     { key: "score",  label: "Score", align: "right" },
 *   ];
 *   const data = [{ name: "Alice", email: "alice@example.com", score: 94 }];
 *
 *   <DataTable columns={columns} data={data} />
 */

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
}

const alignClass = (align?: string) => {
  switch (align) {
    case "center": return "text-center";
    case "right":  return "text-right";
    default:       return "text-left";
  }
};

export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-deco-border">
      <table className="min-w-full text-sm" role="table">
        <thead>
          <tr className="bg-deco-bg border-b border-deco-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  "px-4 py-3 text-xs font-semibold text-deco-text-secondary uppercase tracking-wide whitespace-nowrap",
                  alignClass(col.align),
                ].join(" ")}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-deco-text-tertiary"
              >
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={[
                  "border-b border-deco-border last:border-0 transition-colors duration-100 hover:bg-deco-bg/60",
                  rowIndex % 2 === 0 ? "bg-deco-surface" : "bg-deco-bg/40",
                ].join(" ")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "px-4 py-3 text-deco-text whitespace-nowrap",
                      alignClass(col.align),
                    ].join(" ")}
                  >
                    {row[col.key] != null ? String(row[col.key]) : "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
