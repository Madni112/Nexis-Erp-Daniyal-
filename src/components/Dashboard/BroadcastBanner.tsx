import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft, MdChevronRight, MdWhatsapp, MdArrowForward, MdAutoAwesome } from 'react-icons/md';
import { useThemeColor } from '../../Context/ThemeColor';

const SLIDES = [
  {
    id: 1,
    badge: 'NHT ENTERPRISES BROADCAST',
    title: 'Send the Reminder on WhatsApp',
    description:
      'Open the customer due list, pick a bill and write the message. It goes out through your own WhatsApp number, and the outbox keeps the ones that failed.',
    buttonText: 'Open Due List',
    buttonSubtext: 'Opens the due list screen.',
    route: '/sales/invoice/list',
    type: 'whatsapp'
  },
  {
    id: 2,
    badge: 'FISCAL INTELLIGENCE',
    title: 'Automated Real-Time Ledgers & Accounts',
    description:
      'All customer sales, supplier vouchers, and payment receipts automatically balance in your double-entry Chart of Accounts with instantaneous financial statements.',
    buttonText: 'View Balance Sheet',
    buttonSubtext: 'Opens trial balance & ledger.',
    route: '/Reports/balance-sheet',
    type: 'finance'
  },
  {
    id: 3,
    badge: 'WAREHOUSE CONTROLS',
    title: 'Precision Inventory & Low Stock Alerts',
    description:
      'Track warehouse-to-showroom stock movements, multi-location stock valuations, and receive proactive alerts before critical items run out of stock.',
    buttonText: 'Check Stock Inventory',
    buttonSubtext: 'Opens real-time stock report.',
    route: '/Reports/Stock-Report',
    type: 'inventory'
  }
];

const BroadcastBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const { activeColor } = useThemeColor();
  const slide = SLIDES[currentSlide];

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div
      className="relative w-full rounded-3xl text-white p-6 sm:p-8 md:p-10 shadow-xl overflow-hidden mb-6 border border-white/10 transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg, ${activeColor.primaryDark}FA 0%, #0F172A 70%, ${activeColor.primaryDark} 100%)`
      }}
    >
      
      {/* Subtle background ambient circles */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: activeColor.primary }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: activeColor.primary }}
      />

      {/* Left / Right Arrow Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition z-20"
        title="Previous Slide"
      >
        <MdChevronLeft size={20} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition z-20"
        title="Next Slide"
      >
        <MdChevronRight size={20} />
      </button>

      {/* Main Slide Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-4 sm:px-6 relative z-10 min-h-[220px]">
        
        {/* Left Info Column */}
        <div className="lg:col-span-7 flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-widest text-emerald-200 uppercase">
            <MdAutoAwesome className="text-emerald-300 text-xs" />
            <span>{slide.badge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {slide.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
            {slide.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate(slide.route)}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all hover:scale-102 cursor-pointer"
            >
              {slide.buttonText}
            </button>
            <span className="text-xs text-emerald-100/70">{slide.buttonSubtext}</span>
          </div>
        </div>

        {/* Right Graphical Visuals (WhatsApp Chat Illustration matching Xenith) */}
        <div className="lg:col-span-5 flex items-center justify-center lg:justify-end relative">
          <div className="relative w-full max-w-[340px] flex flex-col gap-2.5 select-none">
            
            {/* Green WhatsApp Badge */}
            <div className="absolute -top-6 -right-2 sm:-right-4 w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 rotate-6 transform hover:scale-110 transition duration-200">
              <MdWhatsapp size={26} />
            </div>

            {/* Chat Bubble 1 (White Incoming Bubble) */}
            <div className="self-start max-w-[80%] rounded-2xl rounded-tl-xs bg-white text-slate-800 px-4 py-2.5 text-xs font-semibold shadow-lg">
              <span>Invoice reminder sent</span>
            </div>

            {/* Chat Bubble 2 (Dark Green Outgoing Bubble) */}
            <div className="self-end max-w-[85%] rounded-2xl rounded-tr-xs bg-[#0B402B] border border-emerald-500/30 text-emerald-100 px-4 py-2.5 text-xs font-medium shadow-md">
              <span>Payment still open this week</span>
            </div>

            {/* Chat Bubble 3 (Light Grey/Green Bubble) */}
            <div className="self-start max-w-[85%] rounded-2xl rounded-tl-xs bg-[#D1E7DD] text-[#0F5132] px-4 py-2.5 text-xs font-semibold shadow-md">
              <span>Thank you – payment received</span>
            </div>

          </div>
        </div>

      </div>

      {/* Slide Indicator Dots */}
      <div className="flex items-center justify-center gap-2 mt-6 relative z-10">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentSlide === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default BroadcastBanner;
