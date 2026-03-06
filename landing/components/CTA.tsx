export function CTA() {
  return (
    <section id="download" className="py-20 sm:py-28 bg-deco-primary-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-deco-primary-light rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-deco-accent rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Begin je ontwikkeltraject
        </h2>
        <p className="text-base text-white/70 leading-relaxed mb-8 max-w-lg mx-auto">
          Of je nu een speler bent die wil groeien of een coach die
          de ontwikkeling van zijn team begeleidt — Deco houdt iedereen gefocust op wat
          ertoe doet.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://github.com/sando-rev/deco/releases/download/v1.6.0/deco-v1.6.0.apk"
            download
            className="inline-flex items-center justify-center gap-2 bg-white text-deco-primary-dark px-8 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.633-2.302 2.633-2.302zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            Download voor Android
          </a>
          <span
            className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white/50 px-8 py-3.5 rounded-full font-semibold cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            iOS binnenkort beschikbaar
          </span>
        </div>
        <p className="text-xs text-white/40 mt-4">
          v1.6.0 &middot; Android APK &middot; iOS versie binnenkort beschikbaar
        </p>
      </div>
    </section>
  );
}
