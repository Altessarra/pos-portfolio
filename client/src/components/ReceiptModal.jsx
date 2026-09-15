import { Coffee, Printer } from 'lucide-react';
import Modal from './Modal.jsx';
import { dateTime, money } from '../utils/format.js';

export default function ReceiptModal({ sale, onClose }) {
  return (
    <Modal title={`Receipt ${sale.receipt_no}`} onClose={onClose}>
      <div id="receipt-print" className="receipt-enter -m-5 overflow-hidden bg-[#fffdf9] text-[#30251d]">
        <div className="border-b border-dashed border-[#d7c7b9] px-6 pb-3 pt-4 text-center">
          <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#7a4b30] text-[#fffaf3]">
            <Coffee size={18} strokeWidth={1.7} />
          </div>
          <p className="mt-2 font-display text-xl tracking-[-0.04em] text-[#412719]">Brim POS</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8b6a52]">Good coffee, better days</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a7558]">Receipt number</p>
          <p className="mt-0.5 font-mono text-[11px] text-[#66554a]">{sale.receipt_no}</p>
        </div>

        <div className="px-6 py-3">
          <div className="grid grid-cols-3 gap-3 border-b border-dashed border-[#d7c7b9] pb-3 text-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a8778]">Date</p>
              <p className="mt-1 font-medium text-[#46372c]">{dateTime(sale.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a8778]">Cashier</p>
              <p className="mt-1 font-medium text-[#46372c]">{sale.cashier_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a8778]">Payment</p>
              <p className="mt-1 font-medium capitalize text-[#46372c]">{sale.payment_method.replace('_', ' ')}</p>
            </div>
          </div>

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-[#e9ded3] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a8778]">
                <th className="pb-2 text-left font-semibold">Item</th>
                <th className="pb-2 text-center font-semibold">Qty</th>
                <th className="pb-2 text-right font-semibold">Price</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map(item => (
                <tr key={item.id} className="border-b border-[#f0e8df] last:border-b-0">
                  <td className="py-2 pr-2 font-medium text-[#30251d]">{item.product_name}</td>
                  <td className="py-2 text-center text-[#67574b]">{item.quantity}</td>
                  <td className="py-2 text-right text-[#67574b]">{money(item.price)}</td>
                  <td className="py-2 text-right font-medium text-[#30251d]">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 space-y-1 border-t border-dashed border-[#d7c7b9] pt-3 text-sm">
            <p className="flex justify-between text-[#67574b]"><span>Subtotal</span><strong className="font-medium text-[#30251d]">{money(sale.subtotal)}</strong></p>
            <p className="flex justify-between text-[#67574b]"><span>Discount</span><strong className="font-medium text-[#30251d]">{money(sale.discount)}</strong></p>
            <p className="flex justify-between border-t border-[#e9ded3] pt-2 text-base font-bold text-[#30251d]"><span>Total</span><strong>{money(sale.total)}</strong></p>
            <p className="flex justify-between text-[#67574b]"><span>Amount received</span><strong className="font-medium text-[#30251d]">{money(sale.amount_received)}</strong></p>
            <p className="flex justify-between text-[#67574b]"><span>Change</span><strong className="font-medium text-[#30251d]">{money(sale.change_amount)}</strong></p>
          </div>

          <div className="mt-4 border-t border-dashed border-[#d7c7b9] pt-3 text-center">
            <p className="font-display text-base italic text-[#67432e]">Thank you for your visit.</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#a28c7b]">Keep this receipt for your records</p>
          </div>

          <div className="print-hidden mt-4 flex justify-end border-t border-[#e9ded3] pt-3">
            <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 !px-4 !py-2.5">
              <Printer size={16} />
              Print receipt
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
