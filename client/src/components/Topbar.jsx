import { Coffee, Menu, Sprout, Sun } from 'lucide-react';
import { useState } from 'react';
import { useCashier } from '../context/CashierContext.jsx';

export default function Topbar() {
  const { cashierName, updateCashierName } = useCashier();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(cashierName);
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(now);
  const time = new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(now);

  return (
    <header className="relative flex min-h-12 items-center justify-end rounded-2xl border border-[#e7dfd5] bg-white/80 px-3 py-2 shadow-[0_3px_16px_rgba(70,45,28,0.04)] backdrop-blur sm:px-5">
      <button
        aria-label="Open navigation"
        className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e4d8cb] text-[#654633] lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="relative mr-auto">
        <button
          type="button"
          aria-expanded={isEditing}
          aria-haspopup="dialog"
          aria-label="Change cashier"
          onClick={() => {
            setDraftName(cashierName);
            setIsEditing(current => !current);
          }}
          className="group inline-flex min-h-9 items-baseline gap-2 border-b border-transparent py-1 text-left transition hover:border-[#8b5a3c] focus:outline-none focus-visible:border-[#8b5a3c] focus-visible:ring-2 focus-visible:ring-[#b97b51]/25"
        >
          <span className="text-xs text-[#83776d]">Cashier</span>
          <span className="max-w-[130px] truncate text-sm font-medium text-[#35251c] sm:max-w-[170px]">{cashierName}</span>
          <span className="text-[11px] text-[#9a7558] transition group-hover:text-[#71442e]">Change</span>
        </button>

        {isEditing && (
          <form
            role="dialog"
            aria-label="Change cashier name"
            onSubmit={(event) => {
              event.preventDefault();
              updateCashierName(draftName);
              setIsEditing(false);
            }}
            className="cashier-editor-enter absolute left-0 top-[calc(100%+8px)] z-30 w-64 border border-[#e4d7ca] bg-[#fffdf9] p-4 shadow-[0_10px_24px_rgba(67,43,26,0.12)]"
          >
            <label htmlFor="cashier-name" className="block text-sm font-medium text-[#57463a]">Cashier name</label>
            <input
              id="cashier-name"
              aria-label="Cashier name"
              autoFocus
              maxLength={80}
              className="mt-2 w-full border border-[#ddcfc1] bg-white px-3 py-2 text-sm text-[#34251c] outline-none transition focus:border-[#9d6846] focus:ring-2 focus:ring-[#b97b51]/20"
              value={draftName}
              onChange={event => setDraftName(event.target.value)}
              onKeyDown={event => event.key === 'Escape' && setIsEditing(false)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="py-1.5 text-xs font-semibold text-[#765e4d] hover:text-[#4d3425]">Cancel</button>
              <button type="submit" aria-label="Save cashier" className="border-b border-[#7a4b30] py-1.5 text-xs font-semibold text-[#7a4b30] hover:border-[#4d2f20] hover:text-[#4d2f20]">Save</button>
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 text-right text-[#714630] xl:flex">
          <Coffee size={16} strokeWidth={1.6} />
          <span className="text-[10px] font-medium uppercase leading-3 tracking-[0.12em]">
            Better coffee<br />brighter days
          </span>
          <Sprout size={20} className="ml-2 text-[#a58d77]" strokeWidth={1.3} />
        </div>
        <div className="hidden h-7 w-px bg-[#e8e0d7] sm:block" />
        <div className="hidden text-right sm:block">
          <p className="text-[11px] text-[#7c756f]">{date}</p>
          <p className="text-sm font-semibold text-[#2c211b]">{time}</p>
        </div>
        <Sun size={19} className="text-[#6f482f]" strokeWidth={1.55} />
      </div>
    </header>
  );
}
