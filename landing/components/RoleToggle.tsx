"use client";

interface RoleToggleProps {
  activeRole: "athlete" | "coach";
  onRoleChange: (role: "athlete" | "coach") => void;
}

export function RoleToggle({ activeRole, onRoleChange }: RoleToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-full p-1 relative">
      {/* Sliding indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-deco-primary rounded-full transition-transform duration-300 ease-in-out ${
          activeRole === "coach" ? "translate-x-[calc(100%+8px)]" : "translate-x-0"
        }`}
      />
      <button
        onClick={() => onRoleChange("athlete")}
        className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
          activeRole === "athlete" ? "text-white" : "text-deco-text-secondary"
        }`}
      >
        Voor spelers
      </button>
      <button
        onClick={() => onRoleChange("coach")}
        className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
          activeRole === "coach" ? "text-white" : "text-deco-text-secondary"
        }`}
      >
        Voor coaches
      </button>
    </div>
  );
}
