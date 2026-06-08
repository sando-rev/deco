'use client';

export default function IconPreviewPage() {
  const variants = [
    { name: 'Current', label: 'Current (too zoomed in)', file: '/icon-variant-current.png' },
    { name: 'A', label: '60% — Moderate padding', file: '/icon-variant-a.png' },
    { name: 'B', label: '52% — More breathing room', file: '/icon-variant-b.png' },
    { name: 'C', label: '45% — Compact, lots of space', file: '/icon-variant-c.png' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Icon Preview</h1>
        <p className="text-gray-500 mt-1">
          Compare icon variants at different sizes. The circle shows the Android adaptive icon mask.
        </p>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-4 gap-6">
        {variants.map((v) => (
          <div key={v.name} className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Variant {v.name}</h2>
            <p className="text-sm text-gray-500">{v.label}</p>

            {/* Circle mask (Android adaptive) */}
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full overflow-hidden shadow-lg"
                style={{ background: '#1B6B4A' }}
              >
                <img src={v.file} alt={`Variant ${v.name}`} className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Circle mask (24x24dp)</p>

            {/* Rounded square mask */}
            <div className="flex justify-center">
              <div
                className="w-24 h-24 overflow-hidden shadow-lg"
                style={{ borderRadius: '22%', background: '#1B6B4A' }}
              >
                <img src={v.file} alt={`Variant ${v.name}`} className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Squircle mask</p>

            {/* Larger preview */}
            <div className="flex justify-center">
              <div
                className="w-40 h-40 rounded-full overflow-hidden shadow-lg"
                style={{ background: '#1B6B4A' }}
              >
                <img src={v.file} alt={`Variant ${v.name}`} className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Large preview</p>
          </div>
        ))}
      </div>

      {/* Simulated home screen */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Simulated Home Screen</h2>
        <div
          className="rounded-2xl p-8 flex gap-8 justify-center items-end"
          style={{
            background: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a5a 100%)',
          }}
        >
          {variants.map((v) => (
            <div key={v.name} className="text-center space-y-2">
              <div
                className="w-16 h-16 rounded-full overflow-hidden shadow-lg mx-auto"
                style={{ background: '#1B6B4A' }}
              >
                <img src={v.file} alt={`Variant ${v.name}`} className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-xs">Variant {v.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
