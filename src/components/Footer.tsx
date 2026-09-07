import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { BrandLogo } from './BrandLogo';
import { Mail, Phone, MapPin } from 'lucide-react';
import { PLATFORM_INFO } from '../data/platformInfo';

export const Footer: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Official Contact Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="md" textColor="light" />
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Platfòm modèn dedye a fòmasyon pwofesyonèl ak pratik an Kreyòl Ayisyen. Aprann konpetans dijital, AI, biznis ak teknoloji avèk ekspè.
            </p>

            {/* Official Platform Information Display */}
            <div className="pt-2 space-y-2.5 text-sm text-slate-300">
              <p className="font-bold text-white text-base tracking-tight">
                {PLATFORM_INFO.name}
              </p>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href={`mailto:${PLATFORM_INFO.email}`}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {PLATFORM_INFO.email}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href={`tel:${PLATFORM_INFO.phone.replace(/\s+/g, '')}`}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {PLATFORM_INFO.phone}
                </a>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-slate-300 space-y-0.5 leading-tight">
                  <p>{PLATFORM_INFO.address.footerFormattedLine1}</p>
                  <p>{PLATFORM_INFO.address.footerFormattedLine2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col: Kou yo */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Kou & Pwodwi</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('courses')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Tout Kou yo
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('shop')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Boutik Dijital (Shop)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('courses')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Kou ki Pi Popilè
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('courses')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Kou Gratis
                </button>
              </li>
              <li>
                <button
                  id="footer-track-order-link"
                  onClick={() => navigate('track-order')}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Swiv Kòmand Ou</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col: Kategori */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Kategori</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('categories')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Teknoloji & Kòd
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('categories')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Maketing Dijital
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('categories')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Entèlijans Atifisyèl (AI)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('categories')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Biznis & Vant
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('categories')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Design & Figma
                </button>
              </li>
            </ul>
          </div>

          {/* Col: Platfòm, Legal & Èd */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platfòm & Èd</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('about')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Konsènan Nou
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('contact')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Kontakte Nou
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('contact')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Kesyon Moun Poze Souvan
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('privacy-policy')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Politik Konfidansyalite
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('terms-conditions')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Tèm & Kondisyon
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('refund-policy')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Politik Ranbousman
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('cookies')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Politik Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {PLATFORM_INFO.name}. Tout dwa rezève.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('privacy-policy')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Konfidansyalite
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('terms-conditions')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Tèm & Kondisyon
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('refund-policy')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Ranbousman
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('contact')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Sipò: {PLATFORM_INFO.email}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
