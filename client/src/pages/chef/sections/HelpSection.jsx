import React from 'react';
import { LifeBuoy, ShoppingBag, CalendarDays, Star, Settings2, BookOpen, MessageCircle } from 'lucide-react';

const HELP_ITEMS = [
  {
    icon: ShoppingBag,
    title: 'Handling meal orders',
    text: 'Open Orders, accept new requests, then move them through preparing → ready → completed. Customers are notified at every step.'
  },
  {
    icon: CalendarDays,
    title: 'Getting bookings',
    text: 'Bookings come from your availability slots. Add slots in Availability, then accept or decline requests. Accepted bookings can be marked completed.'
  },
  {
    icon: Star,
    title: 'Improving your rating',
    text: 'Your rating is a Bayesian average — a few 5-star reviews won’t inflate it. Consistent, well-received meals and service are what move it up.'
  },
  {
    icon: Settings2,
    title: 'Updating your profile',
    text: 'Tagline, bio, specialties, and photos live in Settings. Portfolio photos are separate from your orderable menu.'
  },
  {
    icon: BookOpen,
    title: 'Menu management',
    text: 'Meals are the listings customers buy from the food marketplace. Keep stock updated and mark items sold out when you run low.'
  }
];

const HelpSection = () => (
  <div className="space-y-5">
    <div className="flex items-start gap-3 rounded-2xl border border-[#EAD3DC] bg-[#FFF9F5] px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-[#C45B7C]">
        <LifeBuoy size={18} />
      </span>
      <div>
        <h3 className="font-display text-base font-semibold text-[#381E39]">Chef help centre</h3>
        <p className="mt-0.5 text-sm text-[#76534A]">
          Quick answers to running your HomeChef kitchen. For anything else, reach out — we’re happy to help.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {HELP_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDE7EF] text-[#C45B7C]">
              <Icon size={18} />
            </span>
            <h4 className="mt-3 font-display text-sm font-semibold text-[#381E39]">{item.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-[#76534A]">{item.text}</p>
          </div>
        );
      })}
      <div className="rounded-2xl border border-[#E25C80]/30 bg-gradient-to-br from-[#FDE7EF] to-[#FFFDFC] p-5 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#C45B7C]">
          <MessageCircle size={18} />
        </span>
        <h4 className="mt-3 font-display text-sm font-semibold text-[#381E39]">Still stuck?</h4>
        <p className="mt-1 text-sm leading-relaxed text-[#76534A]">
          Contact the HomeChef support team and include your email so we can look into your account.
        </p>
        <p className="mt-2 text-xs font-semibold text-[#C45B7C]">support@homechef.example</p>
      </div>
    </div>
  </div>
);

export default HelpSection;
