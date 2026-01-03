'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const pathname = usePathname();
    const router = useRouter();
    const currentLocale = useLocale();

    const handleLanguageChange = (newLocale: string) => {
        // Current path: /en/some-page -> splits to ['', 'en', 'some-page']
        // We want to replace the second segment (the locale)
        const segments = pathname.split('/');
        segments[1] = newLocale;
        const newPath = segments.join('/');
        router.push(newPath);
    };

    return (
        <div className="relative group p-2">
            <button className="flex items-center gap-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                <Globe className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white uppercase">{currentLocale}</span>
            </button>

            <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors ${currentLocale === 'en' ? 'text-green-400 font-bold' : 'text-zinc-300'
                        }`}
                >
                    English
                </button>
                <button
                    onClick={() => handleLanguageChange('es')}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors ${currentLocale === 'es' ? 'text-green-400 font-bold' : 'text-zinc-300'
                        }`}
                >
                    Español
                </button>
            </div>
        </div>
    );
}
