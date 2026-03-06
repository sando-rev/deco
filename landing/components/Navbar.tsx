import Image from "next/image";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-deco-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/images/icon.png"
            alt="Deco"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-extrabold text-deco-text tracking-tight">
            Deco
          </span>
        </div>
        <a
          href="#download"
          className="bg-deco-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-deco-primary-dark transition-colors"
        >
          Download de app
        </a>
      </div>
    </nav>
  );
}
