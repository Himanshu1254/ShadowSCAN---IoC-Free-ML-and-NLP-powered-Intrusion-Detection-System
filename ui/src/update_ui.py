import re

with open('d:/Projects/ShadowSCAN/ui/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update getThreatColor
content = re.sub(
    r"const getThreatColor = .*?;",
    """const getThreatColor = (severity: string, attackType: string) => {
  if (severity === 'CRITICAL' || severity === 'HIGH' || attackType === 'Traffic Flood') return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', row: 'hover:bg-rose-950/40', fill: '#fb7185' };
  if (severity === 'MEDIUM' || attackType === 'Port Scan') return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', row: 'hover:bg-amber-950/40', fill: '#fbbf24' };
  return { text: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', row: 'hover:bg-cyan-950/40', fill: '#67e8f9' };
};""",
    content,
    flags=re.DOTALL
)

# Update TooltipHelp
content = re.sub(
    r"const TooltipHelp = .*?\);",
    """const TooltipHelp = ({ text, onDocClick }: { text: string, onDocClick: () => void }) => (
  <div className="group relative inline-flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
    <HelpCircle className="w-4 h-4 text-zinc-500/70 hover:text-cyan-400 transition-colors cursor-help drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-80 p-4 bg-[#050508]/90 backdrop-blur-xl text-zinc-300 text-xs font-sans leading-relaxed rounded-xl border border-zinc-700/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 whitespace-normal">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none" />
      <p className="mb-3 relative z-10">{text}</p>
      <button onClick={onDocClick} className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/40 underline-offset-4 flex items-center gap-1.5 transition-all relative z-10">
        <BookOpen className="w-3.5 h-3.5" /> View Documentation (Ctrl + /)
      </button>
    </div>
  </div>
);""",
    content,
    flags=re.DOTALL
)

# Update StatCard
content = re.sub(
    r"const StatCard = .*?\);",
    """const StatCard = ({ title, value, icon: Icon, color, subtitle, tooltip, onDocClick, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`relative p-6 bg-[#0a0a0e]/40 backdrop-blur-2xl border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-zinc-500/80 transition-all duration-300 shadow-2xl group ${onClick ? 'cursor-pointer hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:-translate-y-1' : ''}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className={`absolute -top-10 -right-10 w-40 h-40 ${color.replace('text-', 'bg-')} opacity-10 rounded-full blur-[50px] group-hover:opacity-25 transition-opacity duration-500`} />
    <div className="flex items-center space-x-5 relative z-10">
      <div className={`p-4 rounded-xl ${color.replace('text-', 'bg-')}/10 border border-zinc-700/50 shadow-inner backdrop-blur-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-7 h-7 ${color} drop-shadow-[0_0_10px_currentColor]`} />
      </div>
      <div>
        <p className="text-[11px] font-sans font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center">
          {title} <TooltipHelp text={tooltip} onDocClick={onDocClick} />
        </p>
        <h3 className="text-3xl font-mono font-black text-white mt-1.5 drop-shadow-md tracking-tight">{value}</h3>
        {subtitle && <p className="text-[10px] font-mono text-zinc-500 mt-1.5 uppercase tracking-[0.15em]">{subtitle}</p>}
      </div>
    </div>
  </div>
);""",
    content,
    flags=re.DOTALL
)

# Update tables: Intrusion Register
content = content.replace('className="overflow-x-auto overflow-y-auto max-h-[500px] border border-zinc-800/50 rounded-lg custom-scrollbar"', 'className="overflow-x-auto overflow-y-auto max-h-[500px] border border-zinc-700/60 rounded-xl custom-scrollbar shadow-inner bg-black/40"')

# Update Table Headers (Intrusion Register)
content = content.replace('text-zinc-500 border-b border-zinc-800 uppercase tracking-widest text-[10px] font-sans font-bold', 'text-zinc-400 border-b border-zinc-700/60 uppercase tracking-[0.2em] text-[10px] font-sans font-bold bg-[#0f0f13]')

# Update the HIDS Tables Header
content = content.replace('text-zinc-500 border-b border-zinc-800 uppercase tracking-widest text-[10px] font-sans font-bold', 'text-zinc-400 border-b border-zinc-700/60 uppercase tracking-[0.2em] text-[10px] font-sans font-bold bg-[#0f0f13]')

# Add glassmorphism to main dashboard sections
content = content.replace('bg-[#0a0a0e] shadow-xl', 'bg-[#0a0a0e]/60 backdrop-blur-xl shadow-2xl')

# Improve charts tooltips styling
content = content.replace("contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}", "contentStyle={{ backgroundColor: 'rgba(9,9,11,0.8)', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontFamily: 'monospace', backdropFilter: 'blur(10px)', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}")

# Improve chart glowing stroke lines
content = content.replace('strokeWidth={1} fill="none" isAnimationActive={false}', 'strokeWidth={1.5} fill="none" isAnimationActive={false} filter="url(#glowNids)"')
content = content.replace('stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2}', 'stroke="#22d3ee" strokeWidth={2} fill="#22d3ee" fillOpacity={0.15} style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.5))" }}')

with open('d:/Projects/ShadowSCAN/ui/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
