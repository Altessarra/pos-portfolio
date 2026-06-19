import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';

export default function ProductImage({ src, alt, className = '', iconSize = 28 }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`grid h-full w-full place-items-center bg-slate-100 text-slate-400 ${className}`}>
      <ShoppingBag size={iconSize} />
    </div>
  );
}
