import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-deco-bg border-t border-deco-border py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/icon.png"
            alt="Deco"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="text-sm font-bold text-deco-text">Deco</span>
        </div>
        <p className="text-xs text-deco-text-tertiary">
          &copy; {new Date().getFullYear()} Deco. Gemaakt voor hockeyontwikkeling.
        </p>
      </div>
    </footer>
  );
}
