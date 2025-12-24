// apps/admin/components/StatCard.tsx
export function StatCard(props) {
    return (<div className="border border-white/10 rounded-lg p-4 bg-white/5">
      <div className="text-xs text-white/60">{props.title}</div>
      <div className="text-2xl font-bold mt-1">{props.value}</div>
      {props.hint && <div className="text-xs text-white/50 mt-2">{props.hint}</div>}
    </div>);
}
