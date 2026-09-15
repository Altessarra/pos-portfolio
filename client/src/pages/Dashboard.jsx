import {
  AlertTriangle,
  ArrowRight,
  Coffee,
  CupSoda,
  Leaf,
  Package,
  ReceiptText,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api.js';
import { money } from '../utils/format.js';

const heroImage = 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=1200&q=85&auto=format&fit=crop';
const featureImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&q=85&auto=format&fit=crop';

function Sparkline({ color = '#6b8d58' }) {
  const gradientId = 'spark-' + color.replace('#', '');

  return (
    <svg aria-hidden="true" viewBox="0 0 84 32" className="h-9 w-20 overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 28C10 26 14 20 22 22S34 14 42 17s10-5 18-4 11-7 20-11v30H2Z" fill={'url(#' + gradientId + ')'} />
      <path d="M2 28C10 26 14 20 22 22S34 14 42 17s10-5 18-4 11-7 20-11" fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function MetricCard({ title, value, description, icon: Icon, iconClassName, sparkColor }) {
  return (
    <article className="motion-card cafe-card group relative min-h-[126px] overflow-hidden p-5">
      <div className="flex h-full items-center gap-4">
        <div className={'grid h-14 w-14 shrink-0 place-items-center rounded-2xl ' + iconClassName}>
          <Icon size={25} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#4c4540]">{title}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <p className="text-[29px] font-bold leading-none tracking-[-0.045em] text-[#17110e]">{value}</p>
            <p className="text-xs font-medium text-[#6a7561]">{description}</p>
          </div>
        </div>
        <div className="hidden self-end pb-1 sm:block">
          <Sparkline color={sparkColor} />
        </div>
      </div>
    </article>
  );
}

function ProductImage({ product }) {
  if (!product.image_url) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f2e8dc] text-[#885333]">
        <Coffee size={18} />
      </span>
    );
  }

  return (
    <img
      className="h-10 w-10 shrink-0 rounded-xl border border-[#eee4d9] bg-[#f2e8dc] object-cover"
      src={product.image_url}
      alt=""
      onError={(event) => {
        event.currentTarget.style.opacity = '0';
      }}
    />
  );
}

export default function Dashboard() {
  const [data, setData] = useState({
    todaySales: 0,
    totalOrders: 0,
    lowStockProducts: [],
    topSellingProducts: []
  });

  useEffect(() => {
    let isCurrent = true;

    api
      .get('/dashboard')
      .then((response) => {
        if (isCurrent) setData(response.data);
      })
      .catch(() => {
        // Keep the portfolio dashboard usable even if a local API is briefly unavailable.
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const quickStats = useMemo(() => {
    const sold = data.topSellingProducts.reduce((total, product) => total + Number(product.sold || 0), 0);
    const averageOrder = data.totalOrders ? Number(data.todaySales || 0) / data.totalOrders : 0;

    return {
      averageOrder,
      sold,
      bestSeller: data.topSellingProducts[0]?.name || 'No sales yet'
    };
  }, [data]);

  const lowStockCount = data.lowStockProducts.length;
  const hasLowStock = lowStockCount > 0;

  return (
    <div>
      <section className="mb-4 grid items-center gap-5 lg:grid-cols-[1fr_320px] xl:mb-5 xl:grid-cols-[1fr_360px]">
        <div className="px-1 pt-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.19em] text-[#89593a]">Your café, today</p>
          <h2 className="font-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[0.9] tracking-[-0.055em] text-[#271812]">
            Good day
          </h2>
          <p className="mt-3 text-lg text-[#5f5953] sm:text-xl">Here’s how your café is doing today.</p>
        </div>
        <div className="relative h-28 overflow-hidden rounded-2xl border border-[#e4dbd0] bg-[#e9dfd3] shadow-[0_8px_20px_rgba(73,49,29,0.08)] sm:h-32">
          <img src={heroImage} alt="Latte art on a cup of coffee" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#51311d]/10 via-transparent to-transparent" />
        </div>
      </section>

      <section aria-label="Today’s performance" className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Today’s Sales"
          value={money(data.todaySales)}
          description="Completed sales"
          icon={Wallet}
          iconClassName="bg-[#e8f0e3] text-[#4d703e]"
          sparkColor="#668a54"
        />
        <MetricCard
          title="Today’s Orders"
          value={data.totalOrders}
          description="Orders placed"
          icon={ShoppingBag}
          iconClassName="bg-[#f8ecde] text-[#965d30]"
          sparkColor="#b57440"
        />
        <MetricCard
          title="Low Stock Items"
          value={lowStockCount}
          description={hasLowStock ? 'Need attention' : 'All stocked'}
          icon={AlertTriangle}
          iconClassName={hasLowStock ? 'bg-[#f9e6e4] text-[#c1493c]' : 'bg-[#e8f0e3] text-[#4d703e]'}
          sparkColor={hasLowStock ? '#d0584a' : '#668a54'}
        />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.04fr_.96fr]">
        <article className="motion-card cafe-card min-w-0 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e9dc] text-[#7b492d]">
                <CupSoda size={21} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-[-0.025em] text-[#201712]">Top-Selling Drinks</h3>
                <p className="text-xs text-[#7e756e]">By units sold today</p>
              </div>
            </div>
            <span className="rounded-lg border border-[#e5dcd2] bg-[#fdfbf8] px-3 py-2 text-xs font-semibold text-[#5d4d42]">Today</span>
          </div>
          <div className="h-[220px] sm:h-[228px]">
            {data.topSellingProducts.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSellingProducts} margin={{ top: 14, right: 6, bottom: 4, left: -20 }}>
                  <CartesianGrid vertical={false} stroke="#eee7df" strokeDasharray="2 3" />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#e4dcd3' }}
                    tickLine={false}
                    tick={{ fill: '#514941', fontSize: 11 }}
                    interval={0}
                    minTickGap={14}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#776d65', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(126, 73, 40, 0.055)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5dcd2',
                      boxShadow: '0 8px 24px rgba(76, 47, 27, 0.10)',
                      color: '#2d1d14'
                    }}
                  />
                  <Bar dataKey="sold" name="Sold" fill="#805034" radius={[7, 7, 1, 1]} maxBarSize={68} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[#e3d8cc] bg-[#fdfbf9] text-center">
                <div>
                  <Coffee className="mx-auto mb-2 text-[#a47a5d]" size={23} />
                  <p className="text-sm font-medium text-[#645a52]">No drink sales recorded yet.</p>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="motion-card cafe-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-5 pb-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e9dc] text-[#7b492d]">
                <Package size={21} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-[-0.025em] text-[#201712]">Low Stock Items</h3>
                <p className="text-xs text-[#7e756e]">Inventory to check</p>
              </div>
            </div>
            <Link to="/inventory" className="inline-flex items-center gap-1 text-sm font-semibold text-[#805034] transition hover:text-[#512f1c]">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {hasLowStock ? (
            <div className="overflow-x-auto px-3 pb-3 sm:px-4">
              <table className="min-w-[540px] w-full text-left">
                <thead>
                  <tr className="bg-[#f6f3ee] text-[11px] font-semibold text-[#6b625a]">
                    <th className="rounded-l-xl px-3 py-3">Product</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3 text-center">Stock</th>
                    <th className="rounded-r-xl px-3 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockProducts.slice(0, 5).map((product) => (
                    <tr key={product.id} className="motion-row border-b border-[#eee8e1] last:border-b-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <ProductImage product={product} />
                          <span className="max-w-[156px] truncate text-sm font-medium text-[#27201a]">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-[#625951]">{product.category_name || 'Uncategorized'}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-bold text-[#c63c2e]">{product.stock}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex rounded-full bg-[#fbe6e3] px-3 py-1 text-[11px] font-semibold text-[#c23f32]">Low stock</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mx-5 mb-5 grid min-h-[232px] place-items-center rounded-2xl border border-dashed border-[#d9e4d4] bg-[#f7faf5] text-center sm:mx-6">
              <div>
                <Leaf className="mx-auto mb-2 text-[#5d8952]" size={25} />
                <p className="text-sm font-semibold text-[#40533c]">Everything is stocked up.</p>
                <p className="mt-1 text-xs text-[#74806f]">Your inventory is looking healthy.</p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.22fr_.62fr_.56fr]">
        <article className="motion-card cafe-card grid min-h-[118px] overflow-hidden sm:grid-cols-[1.02fr_.98fr] xl:h-[118px] xl:min-h-0">
          <img src={featureImage} alt="Freshly poured coffee with a pastry" className="h-28 w-full object-cover sm:h-full xl:h-[118px]" />
          <div className="flex h-full flex-col justify-center overflow-hidden p-4 sm:p-5 xl:h-[118px] xl:p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b5c3e]">Brim POS</p>
            <h3 className="font-display text-[29px] leading-[0.95] tracking-[-0.035em] text-[#4c2f1e] xl:text-[20px]">Good food.<br />Great coffee.</h3>
            <p className="mt-3 text-sm leading-5 text-[#73675e] xl:hidden">Simple tools for a smoother café operation.</p>
          </div>
        </article>

        <article className="motion-card cafe-card overflow-hidden p-4 xl:h-[118px] xl:p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3Icon />
            <h3 className="text-sm font-bold text-[#2d211a]">Quick Stats</h3>
          </div>
          <dl className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[#6f665f]"><ReceiptText size={15} />Average order value</dt>
              <dd className="font-semibold text-[#201712]">{money(quickStats.averageOrder)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[#6f665f]"><CupSoda size={15} />Items sold</dt>
              <dd className="font-semibold text-[#201712]">{quickStats.sold}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-[#6f665f]"><Coffee size={15} />Top drink</dt>
              <dd className="max-w-[110px] truncate font-semibold text-[#201712]">{quickStats.bestSeller}</dd>
            </div>
          </dl>
        </article>

        <article className={'motion-card relative overflow-hidden rounded-2xl border p-4 xl:h-[118px] xl:min-h-0 ' + (hasLowStock ? 'border-[#f1ded4] bg-[#fff8f5]' : 'border-[#dfe9d8] bg-[#f3f8ef]')}>
          <Leaf aria-hidden="true" className="absolute -right-5 -bottom-7 h-24 w-24 text-[#9ab58f]/45" strokeWidth={1} />
          <div className={'grid h-10 w-10 place-items-center rounded-full ' + (hasLowStock ? 'bg-[#f8e6df] text-[#bf5849]' : 'bg-[#e0ebd9] text-[#5c8850]')}>
            {hasLowStock ? <AlertTriangle size={20} /> : <Leaf size={20} />}
          </div>
          <h3 className="mt-3 max-w-[210px] text-base font-bold leading-5 tracking-[-0.025em] text-[#2b3125]">
            {hasLowStock ? 'Keep an eye on your stock.' : 'Everything is brewing smoothly!'}
          </h3>
          <p className="mt-2 max-w-[230px] text-xs leading-4 text-[#697163] xl:hidden">
            {hasLowStock
              ? lowStockCount + ' item' + (lowStockCount === 1 ? '' : 's') + ' need restocking.'
              : 'Stock up, serve well, and keep the good vibes flowing.'}
          </p>
        </article>
      </section>
    </div>
  );
}

function BarChart3Icon() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f3e9dc] text-[#7b492d]">
      <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 3v18h18" />
        <path d="M7 16v-5" />
        <path d="M12 16V8" />
        <path d="M17 16v-9" />
      </svg>
    </span>
  );
}
