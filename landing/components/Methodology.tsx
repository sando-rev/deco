export function Methodology() {
  const steps = [
    {
      num: "01",
      title: "Awareness",
      description:
        "Know where you stand. Self-assess across 8 skill dimensions and see your strengths and gaps clearly.",
      color: "bg-deco-primary/10 text-deco-primary",
    },
    {
      num: "02",
      title: "Intention",
      description:
        "Set specific goals for the 2-3 areas that matter most. AI feedback ensures your goals are actionable.",
      color: "bg-deco-accent/10 text-deco-accent",
    },
    {
      num: "03",
      title: "Deliberate Practice",
      description:
        "Every training session has focus. Pre-session reminders keep your development points front and center.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      num: "04",
      title: "Growth",
      description:
        "Reflect, track, repeat. Watch your skills evolve over weeks and months of intentional development.",
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-deco-text tracking-tight mb-4">
            Built on how real development happens
          </h2>
          <p className="text-base text-deco-text-secondary leading-relaxed">
            Sports psychology shows that growth follows a pattern: awareness of
            where you are, intention to improve, focused practice, and
            reflection. Deco turns this cycle into a daily habit.
          </p>
        </div>

        {/* The Problem */}
        <div className="bg-red-50 rounded-2xl p-6 sm:p-8 mb-8 border border-red-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-2">
                The problem every coach faces
              </h3>
              <p className="text-sm text-red-800/80 leading-relaxed">
                A coach has development conversations with 15+ players. Each
                player is told to focus on 2-3 improvement areas. Within weeks,
                <span className="font-semibold"> both forget</span> what was
                discussed. Training sessions pass without intention. The
                development conversation was wasted.
              </p>
            </div>
          </div>
        </div>

        {/* The Solution - 4 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative bg-deco-bg rounded-2xl p-6 border border-deco-border"
            >
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${step.color} text-sm font-bold mb-3`}
              >
                {step.num}
              </div>
              <h3 className="text-base font-bold text-deco-text mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-deco-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting arrows (desktop only) */}
        <div className="hidden lg:flex justify-center items-center gap-4 -mt-[138px] mb-[100px] pointer-events-none px-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex justify-end">
              <svg
                className="w-6 h-6 text-deco-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
