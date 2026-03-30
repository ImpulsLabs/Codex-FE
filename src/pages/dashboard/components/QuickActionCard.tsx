import { Link } from 'react-router-dom'
import type { QuickActionItem } from '../types'

type QuickActionCardProps = {
  item: QuickActionItem
}

const QuickActionCard = ({ item }: QuickActionCardProps) => {
  return (
    <Link
      to={item.path}
      className="group flex items-center gap-4 rounded-[20px] border-2 border-white bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-[0px_10px_20px_-10px_rgba(15,23,42,0.12)]"
    >
      <div className="rounded-[12px] bg-white p-2.5 text-slate-600 shadow-sm transition-colors group-hover:text-slate-800">
        <item.icon />
      </div>
      <span className="flex-1 font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</span>
      <span className="text-lg font-semibold leading-none text-slate-400 transition-colors group-hover:text-slate-700">&gt;</span>
    </Link>
  )
}

export default QuickActionCard
