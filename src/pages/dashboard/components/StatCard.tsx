import type { StatItem } from '../types'

type StatCardProps = {
  item: StatItem
}

const StatCard = ({ item }: StatCardProps) => {
  return (
    <div className="group rounded-[24px] border-2 border-white bg-white p-6 shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_20px_25px_-15px_rgba(15,23,42,0.15)]">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
      <p className="mt-2 text-4xl font-black text-slate-800">{item.value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{item.sub}</p>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-2/3 rounded-full bg-slate-300 transition-all duration-500 group-hover:bg-slate-400" />
      </div>
    </div>
  )
}

export default StatCard
