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
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  )
}

export default QuickActionCard
