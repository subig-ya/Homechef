import React from 'react';

const SectionCard = ({ title, subtitle, actions, children, className = '' }) => (
  <section className={`overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm ${className}`}>
    {(title || actions) && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3E3E8] px-5 py-4">
        <div>
          {title && <h3 className="font-display text-base font-semibold text-[#381E39]">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-[#76534A]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export default SectionCard;
