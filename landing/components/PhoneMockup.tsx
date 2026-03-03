import Image from "next/image";

interface PhoneMockupProps {
  screenshot?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PhoneMockup({
  screenshot,
  alt = "App screenshot",
  className = "",
  children,
}: PhoneMockupProps) {
  return (
    <div
      className={`relative rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden ${className}`}
      style={{ aspectRatio: "9/19.5" }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[22px] bg-gray-800 rounded-b-2xl z-10" />

      {/* Screen content */}
      <div className="relative w-full h-full bg-white overflow-hidden rounded-[2rem]">
        {screenshot ? (
          <Image
            src={screenshot}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 250px, 300px"
          />
        ) : (
          children
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-gray-500 rounded-full z-10" />
    </div>
  );
}
