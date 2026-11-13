import React, { useState, useRef } from 'react';
import {
  Pin,
  X,
  Plus,
  Trash2,
  FileText,
  User,
  Database,
  Quote,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { EvidenceItem, CorkboardPin, CorkboardLink } from './types';

export const Corkboard: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    investigationTab,
    setInvestigationTab,
    evidenceList,
    corkboardPins,
    corkboardLinks,
    pinEvidence,
    unpinEvidence,
    connectPins,
    removeLink,
    updatePinPosition,
    solvedContradictions,
  } = useGameStore();

  const [selectedPinForLink, setSelectedPinForLink] = useState<string | null>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [showAddEvidenceDrawer, setShowAddEvidenceDrawer] = useState<boolean>(false);
  const boardRef = useRef<HTMLDivElement>(null);

  if (activeModal !== 'corkboard' && !(activeModal === 'terminal' && investigationTab === 'corkboard')) {
    return null;
  }

  // Handle drag on the corkboard
  const handleMouseDown = (pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingPinId(pinId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingPinId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(8, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    updatePinPosition(draggingPinId, x, y);
  };

  const handleMouseUp = () => {
    setDraggingPinId(null);
  };

  const handlePinClick = (pin: CorkboardPin) => {
    if (selectedPinForLink) {
      if (selectedPinForLink !== pin.id) {
        // Connect the two pins!
        connectPins(selectedPinForLink, pin.id, 'Investigative Link');
      }
      setSelectedPinForLink(null);
    }
  };

  // Resolve evidence object for a pin
  const getEvidenceForPin = (evidenceId: string): EvidenceItem | undefined => {
    return evidenceList.find((e) => e.id === evidenceId);
  };

  // Calculate SVG line coordinates between two pins
  const getLineCoordinates = (link: CorkboardLink) => {
    const fromPin = corkboardPins.find((p) => p.id === link.fromPinId);
    const toPin = corkboardPins.find((p) => p.id === link.toPinId);
    if (!fromPin || !toPin) return null;

    return {
      x1: `${fromPin.x + 8}%`,
      y1: `${fromPin.y + 4}%`,
      x2: `${toPin.x + 8}%`,
      y2: `${toPin.y + 4}%`,
      midX: `${(fromPin.x + toPin.x) / 2 + 8}%`,
      midY: `${(fromPin.y + toPin.y) / 2 + 4}%`,
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="relative flex flex-col w-full max-w-6xl h-[92vh] bg-[#221812] border-4 border-[#5a381e] rounded-lg shadow-2xl overflow-hidden text-amber-100">
        {/* Top Header & Tab Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#19110d] border-b-2 border-[#4a2e18]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5a059] to-[#603515] flex items-center justify-center text-black font-bold shadow-md">
                <Pin className="w-4 h-4 text-amber-950" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#c5a059] tracking-wider flex items-center gap-2">
                  <span>DETECTIVE CORKBOARD & CASE GRAPH</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#332014] text-amber-300 border border-[#c5a059]/40 font-mono">
                    {corkboardPins.length} Pins • {corkboardLinks.length} Links
                  </span>
                </h2>
                <p className="text-xs text-amber-200/60 font-mono">
                  Query Creek Crime Ledger • Chapter 1 & 2 Syndicate Investigation
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center ml-8 gap-2 bg-[#25170f] p-1 rounded-md border border-[#4a2e18]">
              <button
                onClick={() => {
                  setInvestigationTab('grimoire');
                  setActiveModal('terminal');
                }}
                className="px-3 py-1 text-xs font-serif rounded hover:bg-[#3d2719] text-amber-200/80 transition-colors flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>SQL Grimoire</span>
              </button>
              <button
                onClick={() => {
                  setInvestigationTab('corkboard');
                  setActiveModal('corkboard');
                }}
                className="px-3 py-1 text-xs font-serif font-bold rounded bg-[#4a2e18] text-[#c5a059] border border-[#c5a059]/40 flex items-center gap-1.5 shadow"
              >
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Corkboard</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Action Buttons */}
            <button
              onClick={() => setShowAddEvidenceDrawer(!showAddEvidenceDrawer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3a2314] hover:bg-[#52331d] text-amber-200 border border-[#c5a059]/40 text-xs font-serif transition-colors shadow"
            >
              <Plus className="w-4 h-4 text-[#c5a059]" />
              <span>Pin Evidence ({evidenceList.length})</span>
            </button>

            <button
              onClick={() => setActiveModal('none')}
              className="p-1.5 rounded hover:bg-[#332014] text-amber-300 transition-colors"
              title="Close Corkboard (Tab or Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions / Status Banner */}
        <div className="bg-[#1e130c] border-b border-[#4a2e18] px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-200/80 font-serif">
            <Sparkles className="w-4 h-4 text-[#c5a059]" />
            <span>
              {selectedPinForLink ? (
                <span className="text-amber-300 font-bold animate-pulse">
                  Click another evidence pin to string a connection thread...
                </span>
              ) : (
                'Drag cards to position • Click "String Thread" to link evidence • Pinned SQL records contradict false witness alibis'
              )}
            </span>
          </div>
          {solvedContradictions.length > 0 && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[11px] bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-700/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Contradictions Shattered: {solvedContradictions.length}</span>
            </div>
          )}
        </div>

        {/* The Corkboard Workspace */}
        <div
          ref={boardRef}
          className="relative flex-1 bg-[#402616] overflow-hidden cursor-crosshair"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(68, 40, 20, 0.4) 0%, rgba(30, 18, 10, 0.8) 100%),
              repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 8px),
              repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 8px)
            `,
          }}
        >
          {/* SVG Connection Lines (Red Threads) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {corkboardLinks.map((link) => {
              const coords = getLineCoordinates(link);
              if (!coords) return null;
              return (
                <g key={link.id}>
                  {/* Outer Shadow for Thread */}
                  <line
                    x1={coords.x1}
                    y1={coords.y1}
                    x2={coords.x2}
                    y2={coords.y2}
                    stroke="rgba(0, 0, 0, 0.6)"
                    strokeWidth="3.5"
                  />
                  {/* Red Thread Core */}
                  <line
                    x1={coords.x1}
                    y1={coords.y1}
                    x2={coords.x2}
                    y2={coords.y2}
                    stroke={link.isContradiction ? '#e11d48' : '#be123c'}
                    strokeWidth="2"
                    strokeDasharray={link.isContradiction ? '4 2' : undefined}
                    className={link.isContradiction ? 'animate-pulse' : ''}
                  />
                  {/* Hypothesis Badge on Thread */}
                  {link.label && (
                    <foreignObject
                      x={`calc(${coords.midX} - 60px)`}
                      y={`calc(${coords.midY} - 12px)`}
                      width="120"
                      height="24"
                    >
                      <div className="flex items-center justify-center px-2 py-0.5 rounded bg-[#1f130b]/90 border border-[#c5a059]/60 text-[10px] text-amber-200 font-mono shadow truncate pointer-events-auto cursor-pointer">
                        {link.label}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Evidence Cards / Pins */}
          {corkboardPins.map((pin) => {
            const ev = getEvidenceForPin(pin.evidenceId);
            if (!ev) return null;

            const isLinkingSource = selectedPinForLink === pin.id;

            return (
              <div
                key={pin.id}
                onMouseDown={(e) => handleMouseDown(pin.id, e)}
                onClick={() => handlePinClick(pin)}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: `rotate(${pin.rotation}deg)`,
                }}
                className={`absolute w-64 bg-[#f4ecd8] text-[#2b1d14] rounded shadow-2xl p-3 border border-[#8b6b4e] cursor-grab active:cursor-grabbing z-20 transition-shadow ${
                  isLinkingSource ? 'ring-4 ring-rose-500 shadow-rose-900/50' : 'hover:shadow-2xl'
                }`}
              >
                {/* Vintage Pushpin Head */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div
                    className={`w-6 h-6 rounded-full shadow-md border-2 border-black/40 flex items-center justify-center ${
                      pin.pinColor === 'red'
                        ? 'bg-rose-700'
                        : pin.pinColor === 'gold'
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  </div>
                </div>

                {/* Card Header & Category Badge */}
                <div className="flex items-start justify-between mt-1 mb-1.5 border-b border-[#8b6b4e]/30 pb-1">
                  <div className="flex items-center gap-1.5">
                    {ev.type === 'suspect' && <User className="w-3.5 h-3.5 text-rose-800" />}
                    {ev.type === 'document' && <FileText className="w-3.5 h-3.5 text-amber-800" />}
                    {ev.type === 'sql_record' && <Database className="w-3.5 h-3.5 text-blue-800" />}
                    {ev.type === 'witness_statement' && <Quote className="w-3.5 h-3.5 text-emerald-800" />}
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#634832] font-bold">
                      {ev.type.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unpinEvidence(pin.id);
                    }}
                    className="text-[#8b6b4e] hover:text-rose-700 p-0.5 rounded transition-colors"
                    title="Unpin Card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Title */}
                <h4 className="font-serif font-black text-sm text-[#24150c] leading-tight mb-1">
                  {ev.title}
                </h4>

                {/* Snippet / Forensic Note */}
                <p className="text-xs font-serif italic text-[#4a3525] line-clamp-3 leading-relaxed mb-2 bg-[#ece1c5]/60 p-1.5 rounded border border-[#d6c5a0]">
                  "{ev.snippet}"
                </p>

                {/* SQL Query Provenance (if applicable) */}
                {ev.queryOrigin && (
                  <div className="mb-2 p-1 rounded bg-[#e1d3b3] border border-[#bfa980] text-[10px] font-mono text-blue-900 truncate">
                    <span className="font-bold">SQL:</span> {ev.queryOrigin}
                  </div>
                )}

                {/* Custom User / Detective Note */}
                {pin.customNote && (
                  <div className="text-[11px] font-mono text-rose-900 font-semibold mb-2">
                    Note: {pin.customNote}
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="flex items-center justify-between border-t border-[#8b6b4e]/30 pt-1.5 text-[11px]">
                  <span className="text-[10px] font-mono text-[#7a5d42]">{ev.dateDiscovered}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPinForLink(isLinkingSource ? null : pin.id);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      isLinkingSource
                        ? 'bg-rose-700 text-white'
                        : 'bg-[#d8c7a6] hover:bg-[#c9b48e] text-[#2b1d14]'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{isLinkingSource ? 'Linking...' : 'String Thread'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Evidence Drawer */}
        {showAddEvidenceDrawer && (
          <div className="absolute right-0 top-14 bottom-0 w-80 bg-[#1a120e] border-l-2 border-[#5a381e] p-4 flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#4a2e18]">
              <h3 className="font-serif font-bold text-sm text-[#c5a059] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Sheriff's Case Evidence</span>
              </h3>
              <button
                onClick={() => setShowAddEvidenceDrawer(false)}
                className="text-amber-300/70 hover:text-amber-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
              {evidenceList.map((item) => {
                const isPinned = corkboardPins.some((p) => p.evidenceId === item.id);
                return (
                  <div
                    key={item.id}
                    className="rounded bg-[#251811] p-2.5 border border-[#4a2e18] flex flex-col space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#c5a059] font-bold">
                        {item.type}
                      </span>
                      {isPinned ? (
                        <span className="text-[10px] text-emerald-400 font-mono">Pinned</span>
                      ) : (
                        <button
                          onClick={() => pinEvidence(item.id)}
                          className="px-2 py-0.5 rounded bg-[#4a2e18] hover:bg-[#684021] text-amber-200 text-[10px] font-serif border border-[#c5a059]/40"
                        >
                          Pin to Board
                        </button>
                      )}
                    </div>
                    <p className="font-serif font-bold text-xs text-amber-100">{item.title}</p>
                    <p className="text-[11px] font-serif text-amber-200/70 line-clamp-2">
                      {item.snippet}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
