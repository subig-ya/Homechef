import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#381E39]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} animate-fade-up overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-xl`}>
        <div className="flex items-center justify-between border-b border-[#F3E3E8] px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-[#381E39]">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#76534A] transition-colors hover:bg-[#FCECEF] hover:text-[#C45B7C]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[#F3E3E8] px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
